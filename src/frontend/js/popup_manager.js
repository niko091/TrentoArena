class BasePopup {
    constructor(id) {
        this.id = id || 'popup-' + Math.random().toString(36).substr(2, 9);
        this.overlay = null;
        this.content = null;
        this.init();
    }

    init() {
        // Check if exists and is valid
        const existing = document.getElementById(this.id);
        if (existing) {
            const content = existing.querySelector('.popup-content');
            const body = existing.querySelector('.popup-body');
            if (content && body) {
                this.overlay = existing;
                this.content = content;
                return;
            } else {
                // Invalid structure, remove and recreate
                existing.remove();
            }
        }

        // Create DOM
        this.overlay = document.createElement('div');
        this.overlay.id = this.id;
        this.overlay.className = 'popup-overlay';

        this.overlay.innerHTML = `
            <div class="popup-content">
                <button class="popup-close" aria-label="Close">&times;</button>
                <div class="popup-header"></div>
                <div class="popup-body"></div>
            </div>
        `;

        document.body.appendChild(this.overlay);
        this.content = this.overlay.querySelector('.popup-content');

        // Events
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        this.overlay.querySelector('.popup-close').addEventListener('click', () => this.close());

        // Escape key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    setTitle(title) {
        const header = this.overlay.querySelector('.popup-header');
        header.innerHTML = `<h2 class="popup-title">${title}</h2>`;
        header.style.display = title ? 'block' : 'none';
    }

    setBody(html) {
        this.overlay.querySelector('.popup-body').innerHTML = html;
    }

    open() {
        this.overlay.style.display = 'flex';
        this.overlay.offsetHeight;
        this.overlay.classList.add('active');
    }

    close() {
        this.overlay.classList.remove('active');
        // Wait for transition
        setTimeout(() => {
            if (!this.overlay.classList.contains('active')) {
                this.overlay.style.display = 'none';
            }
        }, 300);
    }

    isOpen() {
        return this.overlay.classList.contains('active');
    }
}

// Ensure global access
window.BasePopup = BasePopup;

// Utility for dynamic loading from navbar
window.loadPopupSafely = function (cssPath, jsPath, checkInstance) {
    // Ensure shared CSS
    if (!document.querySelector("link[href='/css/popup_shared.css']") && !document.querySelector("link[href='css/popup_shared.css']")) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/popup_shared.css';
        document.head.appendChild(link);
    }

    // Ensure specific CSS
    if (!document.querySelector(`link[href='${cssPath}']`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        document.head.appendChild(link);
    }

    const launch = () => {
        const instance = checkInstance();
        if (instance) {
            instance.show();
        } else {
            // Load script if instance not found
            if (!document.querySelector(`script[src='${jsPath}']`)) {
                const script = document.createElement('script');
                script.src = jsPath;
                script.onload = () => {
                    const inst = checkInstance();
                    if (inst) inst.show();
                };
                document.body.appendChild(script);
            }
        }
    };

    if (window.BasePopup) {
        launch();
    } else {
        // Should catch cases where popup_manager isn't loaded yet
        const script = document.createElement('script');
        script.src = '/js/popup_manager.js';
        script.onload = launch;
        document.body.appendChild(script);
    }
};
