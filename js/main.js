(function() {
    ////方法封装
    var Util = (function() {
        var prefix = "html5_reader_"
        var StorageGetter = function(key) {
            return localStorage.getItem(prefix + key);
        };

        var StorageSetter = function(key, val) {
            return localStorage.setItem(prefix + key, val);
        };

        var getJsonp = function(url, callback) {
            return $.jsonp({
                url: url,
                cache: 'ture',
                callback: 'duokan_fiction_chapter',
                success: function(result) {
                    var data = $.base64.decode(result);
                    var json = decodeURIComponent(escape(data));
                    callback(json);
                }
            })
        };

        return {
            getJsonp: getJsonp,
            StorageGetter: StorageGetter,
            StorageSetter: StorageSetter
        }
    })();
    //DOM节点缓存
    var Dom = {
        top_nav: $('.top-nav'),
        bottom_nav: $('.bottom-nav'),
        font_button: $('#font-button'),
        font_icon: $('#font-icon'),
        control_panel: $('.control-panel'),
        large_btn: $('.large-btn'),
        small_btn: $('.small-btn'),
        content: $('.content'),
        bk_container: $('.bk-container'),
        night_button: $('#night-button')
    };
    var Win = $(window);
    var ReaderModel;
    var readerUI;

    //初始化字体
    var initFontSize = Util.StorageGetter('font_size');
    initFontSize = parseInt(initFontSize);
    if (!initFontSize) {
        initFontSize = 14;
    }
    Dom.content.css('font-size', initFontSize);
    //初始化背景颜色
    var initBackground = Util.StorageGetter('Background');
    if (!initBackground) {
        initBackground = '#e9dfc7';
    }
    $('body').css('background', initBackground);
    
    function main() {
        //入口函数

        ReaderModel = readerModel();
        readerUI = readerBaseFrame(Dom.content);
        ReaderModel.init(function(data) {
            readerUI(data);
        });
        eventHandle();
    }

    function readerModel() {
        //前后端数据交互
        var Chapter_id;
        var ChapterTotal;
        var init = function(UIcallback) {
            getChapterInfo(function() {
                getChapterContent(Chapter_id, function(data) {
                    UIcallback && UIcallback(data);
                });
            });
        };

        var getChapterInfo = function(callback) {
            $.get('data/chapter.json', function(data) {
                ChapterTotal = data.chapters.length;
                var initChapterId = Util.StorageGetter('currentChapterId');
                if (initChapterId > 0 && initChapterId < 5) { //此处应该小于ChapterTotal但案例中测试数据只有4个
                    Chapter_id = initChapterId;
                } else {
                    Chapter_id = data.chapters[1].chapter_id;
                }

                callback && callback();
            }, 'json');
        };

        var getChapterContent = function(Chapter_id, callback) {
            $.get('data/data' + Chapter_id + '.json', function(data) {
                if (data.result == 0) {
                    var url = data.jsonp;
                    Util.getJsonp(url, function(data) {
                        callback && callback(data);
                    })
                }
            }, 'json');

        };

        var prevChapter = function(UIcallback) {
            Chapter_id = parseInt(Chapter_id, 10);
            if (Chapter_id == 0) {
                return;
            }
            Chapter_id -= 1;
            getChapterContent(Chapter_id, UIcallback);
            Util.StorageSetter('currentChapterId', Chapter_id);
        };

        var nextChapter = function(UIcallback) {
            Chapter_id = parseInt(Chapter_id, 10);
            if (Chapter_id == ChapterTotal) {
                return;
            }
            Chapter_id += 1;
            getChapterContent(Chapter_id, UIcallback);
            Util.StorageSetter('currentChapterId', Chapter_id);
        };

        return {
            init: init,
            prevChapter: prevChapter,
            nextChapter: nextChapter
        }
    }

    function readerBaseFrame(container) {
        //基本结构处理
        function parseChapterDate(dataJson) {
            var parseJson = JSON.parse(dataJson);
            var html = '<h4>' + parseJson.t + '</h4>';
            for (var i = 0; i < parseJson.p.length; i++) {
                html += parseJson.p[i];
            }
            return html;
        }
        return function(data) {
            container.html(parseChapterDate(data));
        };
    }

    function eventHandle() {
        //屏幕点击隐藏上下边栏
        $('.touch-area').click(function() {
            Dom.top_nav.toggle();
            Dom.bottom_nav.toggle();
            Dom.control_panel.hide();
            Dom.font_icon.removeClass('change-icon-color');
        });
        //滑动时间
        Win.scroll(function() {
            Dom.top_nav.hide();
            Dom.bottom_nav.hide();
            Dom.font_icon.removeClass('change-icon-color');
            Dom.control_panel.hide();

        });
        //控制面板显示隐藏
        Dom.font_button.click(function() {
            if (Dom.control_panel.css('display') == 'none') {
                Dom.font_icon.addClass('change-icon-color');
                Dom.control_panel.show();
            } else {
                Dom.font_icon.removeClass('change-icon-color');
                Dom.control_panel.hide();
            }
        });
        //字体放大
        Dom.large_btn.click(function() {
            if (initFontSize <= 16) {
                initFontSize += 1;
                Dom.content.css('font-size', initFontSize);
                Util.StorageSetter('font_size', initFontSize);
            }
        });
        //字体缩小
        Dom.small_btn.click(function() {
            if (initFontSize >= 12) {
                initFontSize -= 1;
                Dom.content.css('font-size', initFontSize);
                Util.StorageSetter('font_size', initFontSize);
            }
        });
        //更换背景颜色 
        Dom.bk_container.click(function() {
            $(this).children('div').css('display', 'block').parent().siblings().children('div').css('display', 'none');
            $('body').css('background', $(this).css("background"));
            Util.StorageSetter('Background', $(this).css("background"));

        });

        //夜间、白天模式       
        Dom.night_button.click(function() {
            $(this).children(".item-wrap").toggle();
        });
        $('.day').click(function() {
            $('body').css('background', '#e9dfc7');
            $('.day-color').css('display', 'block').parent().siblings().children('div').css('display', 'none');
            Util.StorageSetter('Background', '#e9dfc7');
        });
        $('.night').click(function() {
            $('body').css('background', '#0f1410');
            $('.night-color').css('display', 'block').parent().siblings().children('div').css('display', 'none');
            Util.StorageSetter('Background', '#0f1410');
        });

        //上翻页
        $('.prev-button').click(function() {
            ReaderModel.prevChapter(function(data) {
                readerUI(data);
            });

        });
        //下翻页
        $('.next-button').click(function() {
            ReaderModel.nextChapter(function(data) {
                readerUI(data);
            });

        });
    }

    main();

})();