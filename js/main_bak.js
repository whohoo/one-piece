var utils = utils || {};
(function(ctx, undefined) {
    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.search);
        if (results == null)
            return "";
        else
            return decodeURIComponent(results[1].replace(/\+/g, " "));
    }
    ctx.para = getParameterByName;
}(utils))

;
(function(ctx, $, undefined) {

    // reset Hammer behavior
    Hammer.defaults.behavior.touchAction = 'pan-y';
    // check Android
    var ua = navigator.userAgent;
    ctx.device = null;
    if (/Android (\d+\.\d+)/.test(ua)) {
        ctx.device = 'android';
    }

    // hold root url
    var url = window.location.origin + window.location.pathname.replace('index.html', '');

    // wechat init
    var wechatObj = window.wechatObj = {
        appId: "",
        MsgImg: url + 'img/weixin.png',
        TLImg: url + 'img/weixin.png',
        url: document.URL,
        // 发送给朋友：title,desc。朋友圈只有title
        title: 'title',
        desc: 'desc',
        fakeid: "",
        callback: function() {}
    };

    // Main
    var it;

    function Main() {}
    Main.instance = null;
    Main.init = function(server) {
        if (Main.instance != null) return Main.instance;
        Main.instance = new Main();
        Main.instance.init(server);
        return Main.instance;
    }
    var mp = Main.prototype;
    // 后台
    mp.server;
    // 用户数据 
    mp.user = {
        islogin: false,
        isguest: false,
        loginurl: ''
    };
    // 默认图的完整路径
    mp.defimg = null;
    // 默认匹配id
    mp.defmatchid = null;
    // dom结构
    mp.dom = {}
    mp.init = function(server) {
        it = this;
        it.server = server;
        it.dom = {
            enter_btn: $('.intro .hander').eq(0),
            file: $('#file'),
            touchlayer: $('#canvas-control')
        }

        $.Velocity.defaults = $.extend($.Velocity.defaults, {
            mobileHA: true
        })
        // wechat event set
        it.initWeChat();

        // check if login
        it.checkUser(function() {
            it.dom.enter_btn.on('touchend', enterMotion);
        });

        // force window scrollTo(0,0) cause minimal-ui
        $(window).on('resize orientationchange', resize)
        resize();

        // Load assets
        var queue = new createjs.LoadQueue(false);
        queue.loadManifest([
            "img/lufei.png",
            "img/enter_btn.png",
            "img/front_wave.png",
            "img/back_wave.png",
            "img/group.png",
            "img/next_btn.png",
            "img/preview_bg.png",
            "img/bar_logo.png",
            "img/upload_tips.png",
            "img/main_bg.jpg",
            "img/x.png"
        ]);
        queue.on("complete", handleComplete, this);
        queue.load();

        var logo = $('.main-ui .logo').eq(0),
            group = $('.main-ui .group').eq(0),
            lufei = $('.main-ui .bg .lufei').eq(0),
            enter_btn = $('.main-ui .enter-btn').eq(0),
            preview = $('.main-ui .preview').eq(0)

        // Assets standby
        function handleComplete() {
            $('.main-ui').show();
            // 初始化位置
            logo.velocity({
                'translateY': '-140%'
            }, 0);
            group.velocity({
                'translateY': '-5%'
            }, 0)
            lufei.velocity({
                'left': '-177px'
            }, 0);
            lufei.find('.slogan').velocity({
                'translateX': '-20px'
            }, 0)
            /*preview.velocity({
                'translateY': '150%'
            }, 0);*/
            enter_btn.velocity({
                'translateY': '140%'
            }, 0);
            // 动画
            $('.intro .intro-bg-fade').velocity({
                'opacity': 0
            }, 500, function() {
                $('.intro .intro-bg-fade').remove();
                $('.intro .intro-bg').velocity({
                    'scaleX': '600%',
                    'scaleY': '600%'
                }, {
                    duration: 1000,
                    complete: moveIn
                })
            })
        }
        // 显示路飞和logo
        function moveIn() {
            $('.intro').remove();
            logo.velocity({
                'translateY': '0'
            }, {
                duration: 400,
                easing: [500, 20],
                delay: 1000
            })
            lufei.velocity({
                'left': '5px'
            }, {
                duration: 600,
                easing: 'swing',
                complete: showGroup
            });
        }

        // 显示群组及按钮
        function showGroup() {
            lufei.find('.slogan').velocity({
                'opacity': 1,
                'translateX': 0
            }, 300)
            enter_btn.velocity({
                'translateY': '0',
                'opacity': 1
            }, {
                duration: 1200,
                easing: [500, 30]
            }).on('touchend.enter', enterMotion)
            group.velocity({
                'opacity': '1',
                'translateY': '0'
            }, 500)
        }

        // when tap the enter btn
        function enterMotion() {
            var user = it.user;
            if (!user.isguest && !user.islogin) {
                window.location = user.loginurl;
            } else {
                // enter motion
                lufei.find('.slogan').velocity({
                    'opacity': 0
                })
                lufei.velocity({
                    left: '100%'
                }, {
                    duration: 800,
                    complete: function() {
                        lufei.remove();
                    }
                })
                group.velocity({
                    bottom: '5px'
                }, {
                    duration: 500,
                    dely: 500
                })
                enter_btn.velocity({
                    'translateY': '140%'
                }, {
                    duration: 400,
                    complete: function() {
                        $(this).off('click.enter');
                        $(this).remove();
                        preview.show().addClass('slideIn')
                    },
                    easing: 'easeInBack'
                })

                // 10个颜色
                $('.bottom-bar li').each(function(i, e) {
                    var c = $(this).html().split(',');
                    $(this).css({
                        'backgroundColor': 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'
                    })
                })
                if (user.isguest == true) {
                    it.showResult(it.defimg, it.defmatchid);
                } else {
                    it.begin();
                }

            }
        }
    }
    mp.checkUser = function(fn) {
        var user = it.user;

        if (utils.para('uid')) {
            // guest-> 默认图，默认匹配id
            it.defuid = utils.para('uid');
            it.defimg = url + 'upload/' + it.defuid;
            it.defmatchid = utils.para('matchid');
            user.isguest = true;
            fn();
        } else {
            // host
            $.post(it.server, {
                task: ''
            }, function(data) {
                console.log(data)
                if (data['state'] == '1') {
                    // 已授权
                    user.islogin = true;
                } else if (data['state'] == '0') {
                    // 未授权
                    user.islogin = false;
                    user.loginurl = data['url'];
                }
                fn();
            }, 'json').fail(function(e, i) {
                console.log(e, i)
            })
        }
    }
    // 显示结果
    mp.showResult = function(img, id) {
        // 预览图片入口
        it.dom.file.hide();
        it.dom.touchlayer.hide();
        ctx.wechatObj.MsgImg = img;
        ctx.wechatObj.TLImg = img;
        $('.ui-area').css('backgroundImage', 'none').css('backgroundColor', '#fff').append('<img src="' + img + '" style="position:absolute;top:0;left:0"/>');
        var vote = false;
        next_btn.html('vote it!').css({
            'width': 150,
            'backgroundColor': 'hotpink'
        }).on('touchend.vote', function() {
            if (!vote) {
                $.post(it.server, {
                    'task': 'vote',
                    'uid': it.defuid
                }, function(data) {
                    if (data['state'] == '1') {
                        vote = true;
                        next_btn.html('do myself ').css({
                            'width': 200,
                            'backgroundColor': 'lightblue'
                        })
                    } else {
                        // 投票出错
                    }
                }, 'json')
            } else {
                window.location = url;
            }
        })
    }
    mp.begin = function() {
        var transCan = null;
        var w = $('.preview .ui-area').width();
        var h = $('.preview .ui-area').height();
        var del_btn = $('.del-btn').eq(0),
            next_btn = $('.next-btn').eq(0)
        it.dom.file.ThumbNail({
            'width': w,
            'height': h,
            'size': 'cover',
            'success': onSuccess,
            'progress': onProgress
        })

        function onSuccess(dataURL, targetSize, file, imageSize, fEvt) {
            var img = new Image();
            img.onload = function() {
                if (!transCan) {
                    transCan = new CanvasTransform($('#result')[0], it.dom.touchlayer[0], img, {
                        pinch: false,
                        rotation: false,
                        drag: false
                    });
                } else {
                    transCan.setImage(img);
                }
                next_btn.addClass('enable');
                del_btn.addClass('enable');

                del_btn.on('touchend.refresh', function() {
                    if (!del_btn.hasClass('enable')) return;
                    transCan.clear();
                    del_btn.removeClass('enable');
                    next_btn.removeClass('enable');
                    setTimeout(function() {
                        it.dom.file.show();
                    }, 400)
                })
                next_btn.on('touchend.commit', function() {
                    if (!next_btn.hasClass('enable')) return;
                    // 进入下一part
                    del_btn.hide();
                    $(this).off('touchend.commit').removeClass('pop').addClass('stop');
                    if (!transCan) return false;
                    var img = new Image();
                    img.onload = function() {
                        $.post(it.server, {
                            'formFile': img.src.substr(22),
                            'task': 'upload'
                        }, function(data) {
                            if (data['state'] == '1') {
                                ctx.wechatObj.url += '?uid=' + data['uid'];
                                ctx.wechatObj.MsgImg = url + 'upload/' + data['uid'];
                                ctx.wechatObj.TLImg = url + 'upload/' + data['uid'];
                                catchColor(img);
                            } else {
                                // 图片上传出错
                            }
                        }, 'json');
                    }
                    img.src = transCan.getData();
                })
            }
            img.src = dataURL;
        }

        function onProgress() {
            // 显示菊花
            it.dom.file.hide();
        }

        function catchColor(image) {
            var colorThief = it.colorThief = new ColorThief();
            var c = colorThief.getColor(image);
            var cur = 0;
            var palette = [];
            $('.bottom-bar li').each(function(i, e) {
                palette[i] = ($(this).html().split(','));
            })
            $.each(palette, function(i, e) {
                var score = checkScore(c, e);
                var s2 = checkScore(c, palette[cur]);
                cur = score > s2 ? i : cur;
            })
            ctx.wechatObj.url += ('&matchid=' + cur);
            $('#commit').html('');
            var commit = $('#commit');
            var commit2 = commit.clone().appendTo($('.bottom-bar'));
            commit.attr('id', 'replay').removeClass('stop').addClass('pop');
            commit.on('touchend', function() {
                window.location.reload();
            })
            commit.css({
                'backgroundColor': '#000',
                'font-size': '20px',
                'width': '70px'
            }).html('replay');
            commit2.animate({
                bottom: '60%',
                width: 120,
                height: 120
            }, 1500, function() {
                $('.preview .preview .tips').css('width', 210).html('your color is rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')');
                ctx.wechatObj.title = '麦当劳航海王'
                ctx.wechatObj.desc = '快来测测你和哪个角色最match';
                $(this).addClass('tran').css({
                    'backgroundColor': 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'
                })
                var coor = $('.bottom-bar li').eq(cur).offset();
                var coor2 = commit2.offset();
                $('.bottom-bar li').addClass('stop').eq(cur).css({
                    'position': 'fixed',
                    'left': coor.left,
                    'top': coor.top
                }).animate({
                    'top': coor2.top + 130,
                    'width': 80,
                    'height': 80,
                    'left': coor2.left + 20
                }, 1500, function() {
                    setTimeout(function() {
                        $('.wechat').addClass('show').on('touchend', function() {
                            $('.wechat').off('touchend').removeClass('show');
                        })
                    }, 1000)
                })
            })
        }
    }
    mp.initWeChat = function() {
        var onBridgeReady = function() {
            WeixinJSBridge.call('showOptionMenu');
            WeixinJSBridge.on('menu:share:appmessage', function(argv) {
                WeixinJSBridge.invoke('sendAppMessage', {
                    "appid": wechatObj.appId,
                    "img_url": wechatObj.MsgImg,
                    "img_width": "180",
                    "img_height": "180",
                    "link": wechatObj.url,
                    "desc": wechatObj.desc,
                    "title": wechatObj.title
                }, function(res) {
                    (wechatObj.callback)();
                });
            });
            WeixinJSBridge.on('menu:share:timeline', function(argv) {
                (wechatObj.callback)();
                WeixinJSBridge.invoke('shareTimeline', {
                    "img_url": wechatObj.TLImg,
                    "img_width": "180",
                    "img_height": "180",
                    "link": wechatObj.url,
                    "desc": wechatObj.desc,
                    "title": wechatObj.title
                }, function(res) {});
            });
        };
        document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
    }

    function resize() {
        $(window).scrollTop(0);
        $(window).scrollLeft(0);
    }
    ctx.Main = Main;

}(window, jQuery))