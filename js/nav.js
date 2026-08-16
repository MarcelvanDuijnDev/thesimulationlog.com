/* js/nav.js — Shared navigation, clock, and theme for all pages */
(function () {

    const NAV_LINKS = [
        { href: '/',          label: 'Latest News', match: /^\/$/ },
        { href: '/metrics/',  label: 'Metrics',     match: /^\/metrics/ },
    ];

    function renderNav() {
        const path = window.location.pathname;

        const tabsHTML = NAV_LINKS.map(l =>
            `<a href="${l.href}" class="nav-link${l.match.test(path) ? ' active' : ''}">${l.label}</a>`
        ).join('');

        const navHTML = `
        <div class="util-bar">
            <div class="util-left">
                <span class="live-pill"><span class="pulse"></span>LIVE</span>
                <span class="util-clock" id="site-clock"></span>
                <span class="util-date" id="site-date"></span>
            </div>
            <span>thesimulationlog.com</span>
        </div>
        <header id="site-header">
            <div class="header-inner">
                <div class="brand">
                    <a href="/" class="brand-link">The Simulation Log</a>
                    <span class="brand-sub">AI, Technology &amp; Frontier Science</span>
                </div>
                <div class="header-right">
                    <button id="theme-btn" class="theme-btn" aria-label="Toggle dark mode">
                        <span class="moon">&#9790;</span>
                        <span class="sun">&#9728;</span>
                    </button>
                    <a href="https://github.com/MarcelvanDuijnDev/thesimulationlog.com/issues/new/choose"
                       target="_blank" rel="noopener" class="submit-btn">Submit Story</a>
                </div>
            </div>
            <nav class="main-nav" aria-label="Main navigation">
                ${tabsHTML}
            </nav>
        </header>`;

        const mount = document.getElementById('nav-mount');
        if (mount) mount.innerHTML = navHTML;
    }

    function renderFooter() {
        const html = `
        <footer id="site-footer">
            <div class="footer-inner">
                <div>
                    <div class="footer-brand-name">The Simulation Log</div>
                    <p class="footer-desc">Independent digital publication covering artificial intelligence, space exploration, energy technology, and scientific discovery.</p>
                    <span class="footer-copy">&copy; 2026 The Simulation Log. All rights reserved.</span>
                </div>
                <div>
                    <h4 class="footer-col-title">Navigation</h4>
                    <ul class="footer-links">
                        <li><a href="/">Latest News</a></li>
                        <li><a href="/metrics/">Metrics</a></li>
                        <li><a href="/timeline/">AI Timeline</a></li>
                        <li><a href="https://github.com/MarcelvanDuijnDev/thesimulationlog.com" target="_blank" rel="noopener">GitHub</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="footer-col-title">Contact</h4>
                    <ul class="footer-links">
                        <li><a href="mailto:contact@thesimulationlog.com">Editorial</a></li>
                        <li><a href="https://github.com/MarcelvanDuijnDev/thesimulationlog.com/issues/new/choose" target="_blank" rel="noopener">Submit a Story</a></li>
                    </ul>
                </div>
            </div>
        </footer>`;

        const mount = document.getElementById('footer-mount');
        if (mount) mount.innerHTML = html;
    }

    function startClock() {
        function tick() {
            const now = new Date();
            const cl = document.getElementById('site-clock');
            const dt = document.getElementById('site-date');
            if (cl) cl.textContent = now.toISOString().slice(11, 19) + ' UTC';
            if (dt) dt.textContent = now.toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
            });
        }
        tick();
        setInterval(tick, 1000);
    }

    function initTheme() {
        const saved = localStorage.getItem('tsl-theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
    }

    function setupThemeToggle() {
        document.addEventListener('click', function (e) {
            if (e.target.closest('#theme-btn')) {
                const current = document.documentElement.getAttribute('data-theme');
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('tsl-theme', next);
            }
        });
    }

    // Run
    initTheme();
    document.addEventListener('DOMContentLoaded', function () {
        renderNav();
        renderFooter();
        startClock();
        setupThemeToggle();
    });

})();
