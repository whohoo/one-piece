function resizeToCover(pw, ph, w, h) {
    var aspectRatio = pw / ph;
    if ((w / h) < aspectRatio) {
        pw *= h / ph;
        ph = h;
    } else {
        ph *= w / pw;
        pw = w;
    }
    return {
        'width': pw,
        'height': ph
    }
}

function resizeToContain(pw, ph, w, h) {
    var aspectRatio = pw / ph;
    if ((w / h) < aspectRatio) {
        ph *= w / pw;
        pw = w;
    } else {
        pw *= h / ph;
        ph = h;
    }
    return {
        'width': pw,
        'height': ph
    }
}
/**
 * 配置说明
 * @options
 * -width:   预览区域宽度
 * -height:  预览区域高度
 * -type:    'image/jpeg','image/png',...
 * -size:    contain: 等比缩放并拉伸, 图片全部显示; cover: 等比缩放并拉伸, 图片完全覆盖容器; auto 图片不拉伸
 * -bgcolor: 默认背景色，传入css颜色，#ffffff,rgba(0,0,0,0)...
 * -success: 成功生成后回调
 *
 * 当不支持FileAPI时,调用IE低级版本
 */
;
(function(window, $, undefined) {
    $.support.filereader = !!(window.File && window.FileReader && window.FileList && window.Blob);
    var setting = {
        width: 0,
        height: 0,
        bgcolor: '#fff',
        type: 'image/jpeg',
        size: 'contain',
        success: null,
        progress: null,
        error: null
    };

    function detectWeixinApi(a) {
        if (typeof window.WeixinJSBridge == "undefined" || typeof window.WeixinJSBridge.invoke == "undefined") {
            setTimeout(function() {
                detectWeixinApi(a)
            }, 200)
        } else {
            a()
        }
    }

    var rFilter = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;

    $.fn.ThumbNail = function(options) {
        if (!$.support.filereader) {
            this.ieThumbNail(options);
            return;
        }
        var opts = {};
        $.extend(opts, setting, options);
        var $self = this;
        var size = opts.size;
        var file, fr;
        var $canvas, canvas, context;
        var image, dataURL;
        var targetSize, imageSize, rawWidth, rawHeight;
        var mpImg;
        $self.on('change', readFile);

        function readFile() {

            var self = this;
            var files = self.files;
            dataURL = '';
            if (!files.length) return;
            file = files[0];
            if (rFilter.test(file.type)) {
                if ($.isFunction(opts.progress)) {
                    opts.progress.call(this);
                }
                fr = new FileReader();
                fr.onerror = function(fEvt) {
                    if ($.isFunction(opts.error)) opts.error.apply(self, [file, fEvt]);
                };
                fr.onload = function(fEvt) {
                    var target = fEvt.target;
                    var result = target.result;
                    image = new Image();
                    var exif;
                    image.onload = function() {
                        EXIF.getData(file, dealImage);
                    }
                    image.src = result;
                };
                fr.readAsDataURL(file);
            } else {
                alert('error!')
            }
        }

        function dealImage() {
            $canvas = $('<canvas></canvas>');
            canvas = $canvas[0];
            canvas.width = opts.width;
            canvas.height = opts.height;
            context = canvas.getContext('2d');
            mpImg = new MegaPixImage(image);
            var orientation = this.exifdata.Orientation;
            var scale, dw, dh;
            rawWidth = image.width;
            rawHeight = image.height;
            if (opts.bgcolor) {
                context.fillStyle = opts.bgcolor;
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
            switch (orientation) {
                case 5:
                case 6:
                case 7:
                case 8:
                    dw = opts.height;
                    dh = opts.width;
                    break;
                default:
                    dw = opts.width;
                    dh = opts.height;
            }
            switch (size) {
                case 'contain':
                    imageSize = resizeToContain(rawWidth, rawHeight, dw, dh);
                    break;
                case 'cover':
                    imageSize = resizeToCover(rawWidth, rawHeight, dw, dh);
                    break;
                default:
                    imageSize = {
                        width: rawWidth,
                        height: rawHeight
                    }
                    break;
            }
            mpImg.render(canvas, {
                width: imageSize.width,
                height: imageSize.height,
                quality: 1,
                orientation: orientation
            });
            scale = imageSize.width / rawWidth;
            context.save();
            context.transform(scale, 0, 0, scale, 0, 0);
            context.restore();
            dataURL = canvas.toDataURL(opts.type, 1);
            if ($.isFunction(opts.success)) {
                targetSize = {
                    width: rawWidth,
                    height: rawHeight
                };
                opts.success.apply(self, [dataURL, targetSize, imageSize, file]);
            }
        }
    };
})(window, jQuery);