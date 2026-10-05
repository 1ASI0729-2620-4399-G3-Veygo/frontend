const darkClass = 'veygo-dark';

/**
 * Applies or removes the dark theme (PrimeVue dark mode selector and Veygo tokens).
 *
 * @param {boolean} enabled - Whether dark mode is active.
 */
export const applyDarkMode = enabled => {
    document.documentElement.classList.toggle(darkClass, Boolean(enabled));
};
