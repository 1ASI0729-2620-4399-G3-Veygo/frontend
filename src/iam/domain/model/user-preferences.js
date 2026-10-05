/**
 * Value object with the preferences a user sets in the profile. It is immutable.
 */
export class UserPreferences {
    /**
     * Creates new preferences.
     *
     * @param {Object} [props] - The preferences.
     * @param {boolean} [props.notifications=true] - Receive booking and message notifications.
     * @param {boolean} [props.promotions=true] - Receive promotions.
     * @param {boolean} [props.twoFactor=false] - Two-factor authentication enabled.
     * @param {boolean} [props.darkMode=false] - Dark theme enabled.
     */
    constructor({notifications = true, promotions = true, twoFactor = false, darkMode = false} = {}) {
        this.notifications = Boolean(notifications);
        this.promotions = Boolean(promotions);
        this.twoFactor = Boolean(twoFactor);
        this.darkMode = Boolean(darkMode);
        Object.freeze(this);
    }

    /**
     * Returns a copy with some preferences changed.
     *
     * @param {Object} changes - The preferences to change.
     * @returns {UserPreferences}
     */
    with(changes) {
        return new UserPreferences({...this, ...changes});
    }
}
