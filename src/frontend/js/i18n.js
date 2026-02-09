class I18n {
    constructor() {
        // 1. Check browser language (navigator.language)
        // 2. Default to 'it'
        const browserLocale = navigator.language.split('-')[0]; // e.g., 'en-US' -> 'en'
        const supportedLocales = ['it', 'en', 'de'];

        this.locale = supportedLocales.includes(browserLocale) ? browserLocale : 'it';

        this.translations = {};
    }

    async init() {
        await this.loadTranslations(this.locale);
        this.translatePage();
        this.updateDir();
    }

    async loadTranslations(locale) {
        try {
            const response = await fetch(`/locales/${locale}.json`);
            if (!response.ok) throw new Error(`Failed to load ${locale} translations`);
            this.translations = await response.json();
            this.locale = locale;
            localStorage.setItem('app-locale', locale);
            document.documentElement.lang = locale;
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            value = value[k];
            if (!value) return key;
        }

        Object.keys(params).forEach(param => {
            value = value.replace(`{${param}}`, params[param]);
        });

        return value;
    }

    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);

            if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
    }

    async setLocale(newLocale) {
        if (newLocale === this.locale) return;
        await this.loadTranslations(newLocale);
        this.translatePage();
        this.updateDir();

        // Dispatch event for other components that might need to know
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { locale: newLocale }
        }));
    }

    updateDir() {
        document.body.dir = this.locale === 'ar' || this.locale === 'he' ? 'rtl' : 'ltr';
    }
}

const i18n = new I18n();
// Expose globally
window.i18n = i18n;

// Initialize on DOM load if not already done manually
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});
