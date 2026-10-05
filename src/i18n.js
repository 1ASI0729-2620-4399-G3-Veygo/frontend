import en from './locales/en.json';
import es from './locales/es.json';
import {createI18n} from 'vue-i18n';

const localeStorageKey = 'veygo.locale';
const supportedLocales = ['en', 'es'];

/**
 * Reads the locale chosen by the user in a previous visit. English is the default.
 *
 * @returns {string} The locale code.
 */
const readSavedLocale = () => {
    try {
        const saved = localStorage.getItem(localeStorageKey);
        return supportedLocales.includes(saved) ? saved : 'en';
    } catch (error) {
        return 'en';
    }
};

const i18n = createI18n({
    legacy: false,
    locale: readSavedLocale(),
    fallbackLocale: 'en',
    messages: {en, es}
});

/**
 * Persists the locale selected by the user.
 *
 * @param {string} locale - The locale code.
 */
export const saveLocale = locale => {
    try {
        localStorage.setItem(localeStorageKey, locale);
    } catch (error) {
        console.warn('Locale could not be persisted:', error);
    }
};

export default i18n;
