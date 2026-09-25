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
})();
