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

    // reset Velocity behavior
    $.Velocity.defaults = $.extend($.Velocity.defaults, {
        mobileHA: true
    })

    // check Android
    var ua = navigator.userAgent;
    ctx.device = null;
    if (/Android (\d+\.\d+)/.test(ua)) {
        ctx.device = 'android';
    }

    // hold root url
    var url = window.location.origin + window.location.pathname.replace('index.html', '');
    var isWechat =false;
    // wechat init
    var wechatObj = window.wechatObj = {
        appId: "",
        MsgImg: url + 'img/weixin.jpg',
        TLImg: url + 'img/weixin.jpg',
        url: document.URL,
        // 发送给朋友：title,desc。朋友圈只有title
        title: '谁和你在一起，为梦想护航',
        desc: '快来测测谁是你的护航搭档',
        fakeid: "",
        callback: function() {}
    };
    initWeChat();

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
        
        // force window scrollTo(0,0) cause minimal-ui
        $(window).on('resize orientationchange', resize)
        resize();

        // Load assets
        var queue = new createjs.LoadQueue(false);
        // 整站素材
        var total_assets = [
            "img/lufei.png",
            "img/enter_btn.png",
            "img/front_wave.png",
            "img/back_wave.png",
            "img/group.png",
            "img/next_btn.png",
            "img/preview_bg.png",
            "img/bar_logo.png",
            "img/main_bg.jpg",
            "img/share_btm.png",
            "img/share_tips.png",
            "img/share_tips2.png",
            "img/result_panel.png",
            "img/slogan.png",
            "img/slogan_2.png",
            "img/slogan_2_2.png",
            "img/progress.png",
            "img/scan_1.png",
            "img/scan_2.png",
            "img/x.png"
        ]
        queue.loadManifest(total_assets);
        queue.on("complete", handleComplete, this);
        queue.on("progress", handleProgress, this);
        queue.load();

        var logo = $('.main-ui .logo').eq(0),
            group = $('.main-ui .group').eq(0),
            lufei = $('.main-ui .bg .lufei').eq(0),
            enter_btn = $('.main-ui .enter-btn').eq(0),
            preview = $('.main-ui .preview').eq(0);

        function handleProgress(e){
            if(!e.loaded) return;
            var per = (e.loaded.toFixed(2)*100>>1)*2;
            $('.intro .loading').html('LOADING '+per+'%');
        }
        // Assets standby
        function handleComplete() {
            $('.main-ui').show();
            // 初始化位置
            logo.css({
                'y': '-140%'
            });
            group.css({
                'y': '-30%'
            })
            // check if login
            it.checkUser(function() {
                if (it.user.isguest == true) {
                    var avatar = $('.main-ui .result-page .avatar>li').eq(it.defmatchid);
                    var imgurl = avatar.attr('data-src');
                    var temp = avatar.find('img')[0];
                    temp.onload = function() {
                        guestMoveIn();
                    }
                    temp.src = imgurl;
                }else{
                    $('.main-ui').show();
                    // 初始化位置
                    lufei.show().css({
                        'left': -177
                    }).find('.slogan').css({
                        'x': -40
                    })
                    enter_btn.show().css({
                        'y': '140%'
                    }).on('touchend', enterMotion);
                    preview.velocity({
                        scaleX: '0.4',
                        scaleY: '0.4',
                        skewX: '50deg',
                        skewY: '-50deg'
                    }, 0).parent().show();
                    // 动画
                    $('.intro .intro-bg-fade').transition({
                        'opacity': 0
                    }, 500, function() {
                        $('.intro .intro-bg-fade').remove();
                        $('.intro .intro-bg').transition({
                            'scale': [6, 6]
                        }, {
                            duration: 1000,
                            complete: MoveIn
                        })
                    })
                }
            });
        }
        // 客人直接显示结果
        function guestMoveIn(){
            $('.intro .intro-bg-fade').transition({
                'opacity': 0
            }, 500, function() {
                $('.intro .intro-bg-fade').remove();
                $('.intro .intro-bg').transition({
                    'scale': [6, 6]
                }, {
                    duration: 1000,
                    complete: function(){
                        $('.intro').remove();
                        logo.transition({
                            'y': '0%'
                        }, {
                            duration: 400,
                            easing: 'easeOutBack',
                            delay: 1000
                        })
                        it.showResult(it.defmatchid,it.defscore);
                    }
                })
            })
        }
        // 主人首页显示
        function MoveIn() {

            $('.intro').remove();
            logo.transition({
                'y': '0%'
            }, {
                duration: 400,
                easing: 'easeOutBack',
                delay: 1000
            })
            lufei.transition({
                'left': 5
            }, {
                duration: 600,
                easing: 'easeOutBack',
                complete: showGroup
            });

            function showGroup() {
                lufei.find('.slogan').transition({
                    'opacity': 1,
                    'x': 0
                }, 300)
                enter_btn.transition({
                    'y': '0',
                    'opacity': 1
                }, {
                    duration: 600,
                    easing: 'easeOutBack'
                }).on('touchend.enter', enterMotion)
                group.transition({
                    'opacity': '1',
                    'y': '0'
                }, 500)
            }
        }

        // when tap the enter btn
        function enterMotion() {
            var user = it.user;
            if (!user.isguest && !user.islogin) {
                window.location = user.loginurl;
            } else {
                // enter motion
                lufei.find('.slogan').hide();
                lufei.removeClass('anim').transition({
                    'opacity': 0
                }, {
                    duration: 500,
                    complete: function() {
                        lufei.remove();
                    }
                })
                $('.bg').transition({
                    'y': '70'
                }, {
                    duration: 1000,
                    delay: 0
                })
                enter_btn.transition({
                    'y': '140%'
                }, {
                    duration: 500,
                    complete: function() {
                        //enter_btn.off('click.enter');
                        enter_btn.remove();
                        preview.show().velocity({
                            scaleX: '1',
                            scaleY: '1',
                            skewX: 0,
                            skewY: 0,
                            opacity: 1
                        }, {
                            duration: 800,
                            easing: [500, 20]
                        })
                    },
                    easing: 'easeInBack'
                })
                it.begin();
            }
        }
    }
    mp.checkUser = function(fn) {
        var user = it.user;
        /*user.isguest = true;
        it.defmatchid = 6;
        it.defscore =65;
        fn();
        return;*/
        if (utils.para('uid')) {
            // guest-> 默认图，默认匹配id
            it.defuid = utils.para('uid');
            it.defimg = url + 'upload/' + it.defuid;
            it.defmatchid = utils.para('matchid');
            it.defscore = utils.para('matchscore');
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
    /**
     * [showResult 显示结果]
     * @param  {[type]} img  [图片实际路径]
     * @param  {[type]} id   [匹配id]
     * @param  {[type]} host [是否为上传图片后的结果预览,默认false为他人来预览]
     */
    mp.showResult = function(id, score, host) {
        var result_page = $('.main-ui .result-page').eq(0),
            avatar = result_page.find('.avatar>li').eq(id),
            slogan = result_page.find('.slogan-2').eq(0),
            panel = result_page.find('.panel').eq(0),
            share = result_page.find('.share .share-tips').eq(0);
        slogan.find('.name').html(avatar.attr('data-name'));
        result_page.show();
        panel.find('.bar-1 .bar-raw img').attr('src','./img/avatar/'+id+'/bar1.png');
        panel.find('p.prop').html(avatar.attr('data-p')+'值');
        panel.find('.bar-2 p.score').html(score+'%');
        if(host){
            if(!isWechat && ctx.device != 'android'){
                $('.wechat').addClass('safari');
            }
            share.on('touchend',function(){
                $('.wechat').addClass('show').on('touchend',function(){
                    $(this).off('touchend');
                    $(this).removeClass('show');
                })
            })
        }else{
            slogan.addClass('refresh');
            share.addClass('refresh').on('touchend',function(){
                window.history.back();
                window.location = url;
            })
        }
        panel.css({
            'opacity': 0,
            'scale': [.4, .4],
            'rotate': -90
        })
        avatar.velocity({
            'scaleX': .2,
            'scaleY': .2
        }, 0);
        avatar.velocity({
            'opacity': 1,
            'scaleX': 1,
            'scaleY': 1
        }, {
            duration: 800,
            easing: [500, 20],
            complete: function() {
                slogan.show().css('opacity', 0).transition({
                    'opacity': 1
                }, 400);
                panel.transition({
                    'opacity': 1,
                    'scale': [1, 1],
                    'rotate': 0
                }, 400, 'easeOutBack', function() {
                    share.transition({
                        y: 0
                    }, 400, 'easeOutBack')
                })
            }
        })
    }
    mp.begin = function() {
        var transCan = null;
        var w = $('.preview .ui-area').width();
        var h = $('.preview .ui-area').height();
        var del_btn = $('.del-btn').eq(0),
            next_btn = $('.next-btn').eq(0),
            preview = $('.main-ui .preview').eq(0),
            scan = preview.find('.scan').eq(0),
            progress = preview.find('.progress').eq(0);
        it.dom.file.ThumbNail({
            'width': w + 5,
            'height': h + 5,
            'size': 'cover',
            'success': onSuccess,
            'progress': onProgress
        })

        function onSuccess(dataURL, targetSize, file, imageSize, fEvt) {
            progress.hide();
            var img = new Image();
            img.onload = function() {
                if (!transCan) {
                    transCan = new CanvasTransform($('#result')[0], it.dom.touchlayer[0], img, {
                        pinch: true,
                        rotation: false,
                        drag: true,
                        rect: false
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
                    var id = setTimeout(function() {
                        clearTimeout(id);
                        it.dom.file.show();
                    }, 400)
                })
                next_btn.on('touchend.commit', function() {
                    if (!next_btn.hasClass('enable')) return;
                    if (!transCan) return false;
                    // 进入下一part
                    del_btn.removeClass('enable');
                    next_btn.removeClass('enable');
                    $(this).off('touchend.commit');
                    scan.css('opacity', 0).show().transition({
                        'opacity': 1
                    }, 400)
                    var img = new Image();
                    img.onload = function() {
                        /*$.post(it.server, {
                            'formFile': img.src.substr(22),
                            'task': 'upload'
                        }, function(data) {
                            if (data['state'] == '1') {
                                ctx.wechatObj.url += '?uid=' + data['uid'];
                                ctx.wechatObj.MsgImg = url + 'upload/' + data['uid'];
                                ctx.wechatObj.TLImg = url + 'upload/' + data['uid'];
                                catchColor(img, url + 'upload/' + data['uid']);
                            } else {
                                // 图片上传出错
                            }
                        }, 'json');*/
                        ctx.wechatObj.url += '?uid=bennyrice';
                        catchColor(img,'');
                    }
                    img.src = transCan.getData();
                })
            }
            img.src = dataURL;
        }

        function onProgress() {
            // 显示菊花
            progress.show();
            it.dom.file.hide();
        }

        function catchColor(image, src) {
            var colorThief = it.colorThief = new ColorThief();
            var c = colorThief.getColor(image);
            var cur = 0;
            var scorest = 0;
            var palette = [];
            $('.result-page ul.avatar>li').each(function(i, e) {
                palette[i] = ($(this).attr('data-color').split(','));
            })
            $.each(palette, function(i, e) {
                var score = checkScore(c, e);
                var s2 = checkScore(c, palette[cur]);
                cur = score > s2 ? i : cur;
                scorest = score>s2?score:s2;
            })
            scorest = (scorest>>1)*2;
            ctx.wechatObj.MsgImg = url + 'img/avatar/' + cur +'/avatar.png';
            ctx.wechatObj.TLImg = url + 'img/avatar/' + cur +'/avatar.png';
            ctx.wechatObj.url += ('&matchid=' + cur+'&matchscore='+scorest);
            ctx.wechatObj.title = '我的护航搭档是' + $('.result-page .avatar li').eq(cur).attr('data-name') + '! 我们的热血值是'+scorest;
            ctx.wechatObj.desc = '快来测测谁是你的护航搭档';
            // 预加载
            var result_page = $('.main-ui .result-page').eq(0),
                avatar = result_page.find('.avatar>li').eq(cur),
                slogan = result_page.find('.slogan-2').eq(0);
            slogan.find('.name').html(avatar.attr('data-name'));
            var imgurl = avatar.attr('data-src');
            var temp = avatar.find('img')[0];

            temp.onload = function() {
                var id = setTimeout(function() {
                    clearTimeout(id);
                    preview.transition({
                        scale: [0.2, 0.2],
                        rotate: '180deg',
                        opacity: 0
                    }, {
                        duration: 600,
                        easing: 'easeInBack',
                        complete: function() {
                            preview.parent().remove();
                            it.showResult(cur, scorest, true);
                        }
                    });
                }, 2000)
            }
            temp.src = imgurl;
        }
    }

    /*********************************************************************/
    function initWeChat() {
        var onBridgeReady = function() {
            isWechat = true;
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