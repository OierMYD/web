/* =========================================================
   大连市第二十四中学信息社团 · 全站交互脚本 v2
   功能：移动端导航开合 / 当前页高亮 / 滚动进度条 /
        回到顶部 / 滚动入场动效 / 图片点击预览
   全部为渐进增强：脚本未加载时页面依然完整可用。
   ========================================================= */
(function () {
    'use strict';

    // 标记 JS 已启用，供 CSS 使用（入场动效等）
    document.documentElement.classList.add('js');

    /* ---------- 1. 移动端导航开合 ---------- */
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('siteNav');

    function closeNav() {
        if (!nav) return;
        nav.classList.remove('open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        // 点击菜单项后自动收起
        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) closeNav();
        });

        // Esc 关闭
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeNav();
        });

        // 窗口变宽时重置状态
        window.addEventListener('resize', function () {
            if (window.innerWidth > 900) closeNav();
        });
    }

    /* ---------- 2. 当前页导航高亮 ---------- */
    (function markActiveLink() {
        var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        var links = document.querySelectorAll('.nav-link');
        for (var i = 0; i < links.length; i++) {
            var href = (links[i].getAttribute('href') || '').split('/').pop().toLowerCase();
            if (href === path) {
                links[i].classList.add('is-active');
                links[i].setAttribute('aria-current', 'page');
            }
        }
    })();

    /* ---------- 3. 阅读进度条 ---------- */
    var bar = document.querySelector('.progress');

    function onScroll() {
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
        if (bar) bar.style.transform = 'scaleX(' + ratio + ')';
        var btn = document.getElementById('toTop');
        if (btn) btn.classList.toggle('show', window.pageYOffset > 420);
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
            onScroll();
            ticking = false;
        });
    }, { passive: true });
    onScroll();

    /* ---------- 4. 回到顶部 ---------- */
    var toTop = document.getElementById('toTop');
    if (toTop) {
        toTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- 5. 滚动入场动效 ---------- */
    (function revealOnScroll() {
        var items = document.querySelectorAll('.reveal, .reveal-in');
        if (!items.length) return;

        var reduce = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduce || !('IntersectionObserver' in window)) {
            for (var k = 0; k < items.length; k++) items[k].classList.add('in');
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

        // 同组元素依次延迟出现
        var groups = {};
        for (var i = 0; i < items.length; i++) {
            var el = items[i];
            var key = el.getAttribute('data-reveal-group') || ('solo-' + i);
            var idx = groups[key] === undefined ? 0 : groups[key] + 1;
            groups[key] = idx;
            el.style.setProperty('--d', (Math.min(idx, 6) * 0.07) + 's');
            io.observe(el);
        }
    })();

    /* ---------- 6. 图片点击预览 ---------- */
    (function lightbox() {
        var targets = document.querySelectorAll('[data-zoom] img, .photo img, .qr-frame img');
        if (!targets.length) return;

        var box = document.createElement('div');
        box.className = 'lightbox';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-label', '图片预览');
        box.innerHTML =
            '<button class="lightbox-close" type="button" aria-label="关闭预览">&times;</button>' +
            '<img alt="图片预览">';
        document.body.appendChild(box);

        var big = box.querySelector('img');

        function open(src, alt) {
            big.src = src;
            big.alt = alt || '图片预览';
            box.classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        function shut() {
            box.classList.remove('open');
            document.body.style.overflow = '';
            // 释放显存
            window.setTimeout(function () {
                if (!box.classList.contains('open')) big.removeAttribute('src');
            }, 320);
        }

        for (var i = 0; i < targets.length; i++) {
            (function (img) {
                img.addEventListener('click', function (e) {
                    e.stopPropagation();
                    open(img.currentSrc || img.src, img.alt);
                });
            })(targets[i]);
        }

        box.addEventListener('click', shut);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && box.classList.contains('open')) shut();
        });
    })();

    /* ---------- 7. 液态玻璃 · 灵动动效（渐进增强） ----------
       导航弹性玻璃滑块 / 灵动岛收拢舒展。
       检测到系统"减弱动效"偏好时整体跳过。 */
    (function liquidMotion() {
        var reduce = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        /* 7.1 跟随鼠标的圆形光斑已按需求移除 */

        /* 7.2 灵动岛：下滑收拢变细变短，上滑舒展 */
        var topbar = document.querySelector('.topbar');
        var onIsland = [];      // 形态切换后需要重新测量的组件（导航滑块等）
        var compact = false;
        var lastY = window.pageYOffset;
        var scrollTicking = false;

        function notifyIsland() {
            for (var i = 0; i < onIsland.length; i++) {
                try { onIsland[i](compact); } catch (err) {}
            }
        }

        function setState(next) {
            if (next === compact) return;
            compact = next;
            if (topbar) topbar.classList.toggle('is-compact', compact);
            notifyIsland();
        }

        function readScroll() {
            scrollTicking = false;
            var y = window.pageYOffset;
            if (topbar) topbar.classList.toggle('is-stuck', y > 28);
            if (!topbar) return;
            if (y < 56) { setState(false); lastY = y; return; }
            var dy = y - lastY;
            if (dy > 14) setState(true);
            else if (dy < -14) setState(false);
            if (Math.abs(dy) > 4) lastY = y;
        }

        window.addEventListener('scroll', function () {
            if (scrollTicking) return;
            scrollTicking = true;
            requestAnimationFrame(readScroll);
        }, { passive: true });
        readScroll();

        /* 7.3 导航弹性玻璃滑块：仅悬停时出现（仅宽屏）。
           选中态由水滴背景（CSS）标识，滑块不常驻，
           避免灵动岛收放时气泡滞后漂移。 */
        var navList = document.querySelector('.nav-list');
        if (navList && window.matchMedia && window.matchMedia('(min-width: 901px)').matches) {
            var glow = document.createElement('span');
            glow.className = 'nav-glow';
            glow.setAttribute('aria-hidden', 'true');
            navList.insertBefore(glow, navList.firstChild);
            var hovered = null;

            function place(el, instant) {
                if (!el) return;
                if (instant) glow.style.transition = 'none';
                var lr = navList.getBoundingClientRect();
                var er = el.getBoundingClientRect();
                glow.style.width = er.width + 'px';
                glow.style.height = er.height + 'px';
                glow.style.transform = 'translate(' +
                    (er.left - lr.left).toFixed(1) + 'px, ' +
                    (er.top - lr.top).toFixed(1) + 'px)';
                if (instant) { void glow.offsetWidth; glow.style.transition = ''; }
            }

            navList.addEventListener('pointerover', function (e) {
                var a = e.target.closest ? e.target.closest('.nav-link') : null;
                if (!a) return;
                var fresh = hovered !== a;
                hovered = a;
                place(a, !glow.classList.contains('on'));
                if (fresh) glow.classList.add('on');
            });
            navList.addEventListener('pointerout', function (e) {
                var a = e.target.closest ? e.target.closest('.nav-link') : null;
                if (!a) return;
                var to = e.relatedTarget;
                if (to && a.contains(to)) return;
                var next = to && to.closest ? to.closest('.nav-link') : null;
                if (next) return; /* 移到其他菜单项，pointerover 会接管 */
                hovered = null;
                glow.classList.remove('on');
            });
            window.addEventListener('resize', function () {
                if (hovered) place(hovered, true);
                else glow.classList.remove('on');
            });

            /* 灵动岛收放过程中气泡先隐去，形变结束后若仍悬停再落位 */
            onIsland.push(function () {
                glow.classList.remove('on');
                if (!hovered) return;
                window.setTimeout(function () {
                    if (!hovered) return;
                    place(hovered, true);
                    glow.classList.add('on');
                }, 480);
            });
        }
    })();

    /* ---------- 8. 日/夜模式切换（全站记忆） ----------
       IDE 编码工作台保持固有深色，不随模式改变，保证代码可读性。 */
    (function themeToggle() {
        var btn = document.getElementById('themeToggle');
        var root = document.documentElement;

        function apply(theme) {
            root.setAttribute('data-theme', theme);
            if (!btn) return;
            var dark = theme === 'dark';
            btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
            btn.setAttribute('aria-label', dark ? '切换白天模式' : '切换黑夜模式');
            btn.setAttribute('title', dark ? '切换白天模式' : '切换黑夜模式');
        }

        apply(root.getAttribute('data-theme') || 'light');

        if (btn) {
            btn.addEventListener('click', function () {
                var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                try { localStorage.setItem('itclub-theme', next); } catch (e) {}
                apply(next);
            });
        }
    })();
})();
