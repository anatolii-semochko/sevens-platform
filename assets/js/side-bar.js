
(function () {
    const TABLET_MIN = 481;
    const TABLET_MAX = 1200;
    const DESKTOP_MIN = 1201;
    const LS_KEY = 'sidebarStateTablet'; // 'icon' | 'expanded'

    const sidebar = document.querySelector('#sidebar, .sidebar');
    if (!sidebar) return;

    const isTablet  = () => window.innerWidth >= TABLET_MIN && window.innerWidth <= TABLET_MAX;
    const isDesktop = () => window.innerWidth >= DESKTOP_MIN;

    function setExpanded(on) {
        if (on) {
            sidebar.classList.add('expanded');
            localStorage.setItem(LS_KEY, 'expanded');
            ensureCollapseButton();
        } else {
            sidebar.classList.remove('expanded');
            localStorage.setItem(LS_KEY, 'icon');
        }
    }

    function restoreStateForTablet() {
        const saved = localStorage.getItem(LS_KEY);
        if (saved === 'expanded') setExpanded(true);
        else setExpanded(false);
    }

    /* collapse button inside sidebar */
    function ensureCollapseButton() {
        let btn = sidebar.querySelector('[data-role="tablet-collapse"]');
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('data-role', 'tablet-collapse');
            btn.className = 'tablet-collapse btn btn-light btn-sm rounded-circle shadow-sm';
            btn.innerHTML = '<i class="bi bi-chevron-left"></i>'; // як у першому прикладі
            sidebar.insertBefore(btn, sidebar.firstElementChild);
        }
        if (!btn._binded) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (isTablet()) setExpanded(false);
            });
            btn._binded = true;
        }
    }

    /* open on click anywhere*/
    function onSidebarClick(e) {
        if (!isTablet()) return;

        const collapsed = !sidebar.classList.contains('expanded');
        if (collapsed) {
            const link = e.target.closest('a');
            if (link) {
                e.preventDefault(); e.stopPropagation();
                setExpanded(true);
                // опційно фокусимо той самий лінк
                setTimeout(() => { try { link.focus(); } catch(_){} }, 0);
                return;
            }
            setExpanded(true);
        }
    }

    function onResize() {
        if (isDesktop()) {
            sidebar.classList.add('expanded');
            return;
        }
        if (isTablet()) {
            restoreStateForTablet();
            return;
        }
    }

    window.addEventListener('resize', onResize);
    sidebar.addEventListener('click', onSidebarClick);

    onResize();
})();



/* Mobile overlay toggle (≤480px)*/
(function () {
    var MOBILE_MAX = 480;

    var toggleBtn = document.getElementById('menuToggle');
    var backdrop  = document.getElementById('sidebarBackdrop');

    function isMobile() {
        return window.innerWidth <= MOBILE_MAX;
    }

    function setMenuOpen(on) {
        document.documentElement.setAttribute('data-menu', on ? 'open' : 'closed');
    }

    function toggleMenu() {
        if (!isMobile()) return;
        var open = document.documentElement.getAttribute('data-menu') === 'open';
        setMenuOpen(!open);
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            toggleMenu();
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', function () {
            setMenuOpen(false);
        });
    }

    window.addEventListener('resize', function () {
        if (!isMobile()) setMenuOpen(false);
    });

    setMenuOpen(false);
})();
