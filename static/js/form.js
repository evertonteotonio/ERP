$(function() {
    // 保存事件处理
    $(".form-save-btn").on("click", function(e) {
        var form = e.currentTarget.form;
        var formNode = $('#' + form.id);
        var formData = {
            FormAction: "create" //默认为创建
        };
        var xsrf = $("input[name ='_xsrf']");
        if (xsrf.length > 0) {
            xsrf = xsrf[0].value;
            // formData._xsrf = xsrf[0].value;
        }
        // form表单验证
        var bootstrapValidator = formNode.data('bootstrapValidator');
        // //手动触发验证
        bootstrapValidator.validate("validate");
        // // 验证结果
        var formValid = bootstrapValidator.isValid();
        console.log(formValid);
        console.log(bootstrapValidator);
        if (!formValid) {
            toastr.error("数据验证失败，请检查数据", "错误");
            return false;
        }

        //    获得form直接的字段
        var formFields = $(form).find(".form-create,.form-edit");
        if ($(form).find("input[name='recordID']").length > 0) {
            formData.FormAction = "update";
        }
        //根据数据类型获得正确的数据,默认string
        var getCurrentDataType = function(val, dataType) {
            if (dataType == "" || dataType === undefined || dataType === null) {
                dataType = "string";
            }
            switch (dataType) {
                case "int": // 整形
                    val = parseInt(val);
                    break;
                case "float": // 浮点型
                    val = parseFloat(val);
                    break;

                case "array_int": // 整形数组
                    var a_arr = [];
                    for (var a_i = 0, a_l = val.length; a_i < a_l; a_i++) {
                        a_arr.push(parseInt(val[a_i]));
                    }
                    val = a_arr;
                    break;
                case "arrar_float": //  浮点型数组
                    var a_arr = [];
                    for (var a_i = 0, a_l = val.length; a_i < a_l; a_i++) {
                        a_arr.push(parseFloat(val[a_i]));
                    }
                    val = a_arr;
                    break;
            }
            return val
        };
        for (var i = 0, len = formFields.length; i < len; i++) {
            var self = formFields[i];
            // 处理radio数据
            if (self.type == "radio") {
                if ($(self).hasClass("checked")) {
                    formData[self.name] = $(self).val();
                }
            } else if (self.type == "checkbox") {
                if (self.checked) {
                    formData[self.name] = true;
                }
            } else {
                var val = $(self).val();
                if (val != "") {
                    // 若为null跳出此次循环
                    if (val === null) {
                        continue;
                    }
                    formData[self.name] = getCurrentDataType(val, $(self).data("type"))
                }
            }
        }
        var getTreeLineData = function(cellFields, action = "create") {
            var funCellData = {
                FormAction: action
            };
            for (var j = 0, cellLen = cellFields.length; j < cellLen; j++) {
                var funHasProp = false;
                var cell = cellFields[j];
                var cellName = cell.name;
                var oldValue = $(cell).data("oldvalue");
                console.log(oldValue);
                var cellValue = $(cell).val();
                if (cellValue != "") {
                    if (cellValue === null) {
                        continue;
                    }
                    funCellData[cellName] = getCurrentDataType(cellValue, $(cell).data("type"));
                    funHasProp = true;
                }
            }
            return { cellData: funCellData, hasProp: funHasProp };
        };
        //获得form-tree-create信息
        var formTreeFields = $(form).find(".form-tree-line-create");
        for (var i = 0, lineLen = formTreeFields.length; i < lineLen; i++) {
            var self = formTreeFields[i];
            var treeName = $(self).data("treename");
            if (formData[treeName] == undefined) {
                formData[treeName] = [];
            }
            var cellFields = $(self).find(".form-line-cell-create");
            var resultCreate = getTreeLineData(cellFields, "create");
            if (resultCreate.hasProp) {
                formData[treeName].push(resultCreate.cellData);
            }
        }
        //获得form-tree-edit信息
        var formTreeFields = $(form).find(".form-tree-line-edit");
        for (var i = 0, lineLen = formTreeFields.length; i < lineLen; i++) {
            var self = formTreeFields[i];
            var treeName = $(self).data("treename");
            if (formData[treeName] == undefined) {
                formData[treeName] = [];
            }
            var createCellFields = $(self).find(".form-line-cell-create");
            if (createCellFields.length > 0) {
                var resultCreate = getTreeLineData(createCellFields, "create");
                if (resultCreate.hasProp) {
                    formData[treeName].push(resultCreate.cellData);
                }
            }
            var editCellFields = $(self).find(".form-line-cell-edit");
            if (editCellFields.length > 0) {
                var resultCreate = getTreeLineData(editCellFields, "update");
                if (resultCreate.hasProp) {
                    formData[treeName].push(resultCreate.cellData);
                }
            }
        }
        console.log(formData);
        var postParams = {
            postData: JSON.stringify(formData),
            _xsrf: xsrf
        };
        var method = $(form).find("input[name='_method']");
        if (method.length > 0) {
            postParams._method = method.val();
        }
        console.log(postParams);
        $.post(form.action, postParams).success(function(response) {
            if (response.code == 'failed') {
                if (formData.FormAction == "update") {
                    toastr.error("修改失败", "错误");
                } else {
                    toastr.error("创建失败", "错误");
                }
                return;
            } else {
                if (formData.FormAction == "update") {
                    toastr.success("<h3>修改成功</h3><br><a href='" + response.location + "'>1秒后跳转</a>");
                } else {
                    toastr.success("<h3>创建成功</h3><br><a href='" + response.location + "'>1秒后跳转</a>");
                }
                // setTimeout(function() { window.location = response.location; }, 1000);
            }
        });
        e.preventDefault();
    });
    //文件导入
    $('#import-file-excel').fileinput({
        language: 'zh',
        uploadUrl: '#',
        multiple: false,
        minFileCount: 1,
        showPreview: false,
        uploadExtraData: (function() {
            'use strict';
            var params = {};
            var xsrf = $("input[name ='_xsrf']");
            if (xsrf.length > 0) {
                params._xsrf = xsrf[0].value;
            }
            params.upload = "uploadFile";
            params.action = "upload";
            params._method = "PUT";
            return params;
        })(),
        allowedFileExtensions: ['xlsx', 'csv', 'xls'],
    });
    // 图片上传处理
    $('#product-images').fileinput({
        language: 'zh',
        uploadUrl: '#',
        uploadExtraData: (function() {
            var params = {};
            var xsrf = $("input[name ='_xsrf']");
            if (xsrf.length > 0) {
                params._xsrf = xsrf[0].value;
            }
            params.upload = "uploadFile";
            params.action = "upload";
            params._method = "PUT";
            return params;
        })(),
        allowedFileExtensions: ['jpg', 'png', 'gif'],
    });
    $(".form-disabled .file-input").hide();
    $("#productTemplateForm .form-edit-btn").bind("click.images", function() {
        $(".file-input").show();
    });
    $("#productTemplateForm .form-save-btn,#productTemplateForm .form-cancel-btn").bind("click.images", function() {
        $(".file-input").hide();
    });
    // 单击图片悬浮
    $(".click-modal-view").dblclick(function(e) {
        var images = $(".click-modal-view");
        var imagesLen = images.length;
        var indicatorsHtml = "";
        var carouselInnerHtml = "";
        for (var i = 0; i < imagesLen; i++) {
            if (i == 0) {
                indicatorsHtml += ' <li data-target="#productImagesCarousel" data-slide-to=' + i + ' class="active"></li>';
                carouselInnerHtml += '<div class="item active"> <img src="' + images[i].src + '" alt=""> </div>';
            } else {
                indicatorsHtml += ' <li data-target="#productImagesCarousel" data-slide-to=' + i + '></li>';
                carouselInnerHtml += '<div class="item "> <img src="' + images[i].src + '" alt=""> </div>';
            }
        }
        $("#productImagesCarousel .carousel-indicators").append(indicatorsHtml);
        $("#productImagesCarousel .carousel-inner").append(carouselInnerHtml);
        $('#productImagesModal').modal('show');
    });
    // 款式form中图片懒加载
    $('a[href="#productImages"]').on('shown.bs.tab', function(e) {
        // 图片加载
        $("#productImages .click-modal-view").each(function(index, el) {
            if ($(el).attr("src") == "") {
                $(el).attr("src", $(el)[0].dataset["src"]);
            }
        });
    });
});