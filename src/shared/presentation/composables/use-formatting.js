import {computed} from 'vue';
import {useI18n} from 'vue-i18n';

/**
 * Composable that exposes locale-aware formatting helpers for domain value objects.
 *
 * @returns {{intlLocale: import('vue').ComputedRef<string>, formatMoney: Function, formatRange: Function, formatDate: Function, translateOrKeep: Function}}
 */
export function useFormatting() {
    const {locale, t, te} = useI18n();

    /** Intl locale used for numbers and dates (English US or Latin American Spanish). */
    const intlLocale = computed(() => locale.value === 'es' ? 'es-419' : 'en-US');

    /**
     * @param {import('@/shared/domain/model/money.js').Money} money - The amount.
     * @returns {string}
     */
    const formatMoney = money => money.format(intlLocale.value);

    /**
     * @param {import('@/shared/domain/model/date-range.js').DateRange} range - The period.
     * @returns {string}
     */
    const formatRange = range => range.format(intlLocale.value);

    /**
     * @param {import('@/shared/domain/model/date-time.js').DateTime} dateTime - The instant.
     * @returns {string}
     */
    const formatDate = dateTime => dateTime.format(intlLocale.value);

    /**
     * Translates a message when it is an i18n key, otherwise returns it unchanged
     * (API error messages are already human-readable).
     *
     * @param {string} message - Key or message.
     * @returns {string}
     */
    const translateOrKeep = message => te(message) ? t(message) : message;

    return {intlLocale, formatMoney, formatRange, formatDate, translateOrKeep};
}
