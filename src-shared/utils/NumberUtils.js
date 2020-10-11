class NumberUtils {

    /**
     * Returns number formated
     * @param {Number} n - Number to be formated
     * @param {String} [prefix=] - Prefix to be added
     * @param {String} [suffix=] - Suffix to be added
     * @param {Boolean} [showSign=false] - To add or not the + sign in the number
     * @param {String} [locale=pt-BR] - Locale to be formated
     * @param {Number} [digits=2] - Number of digits for the number
     * @returns {String} - Formatted number
     */
    static formatNumber(n, prefix = '', suffix = '', showSign = false, locale = 'pt-BR', digits = 2, useGrouping = true) {
        if (n === null || n === undefined) return null;
        const sign = n >= 0 && showSign ? '+' : '';
        return `${prefix}${sign}${n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: useGrouping })}${suffix}`;
    }

    /**
     * Format a number string back to Number (ex: R$ 1.)
     * @param {String} n - The number with in string
     * @returns {Number} - The number from currency
     */
    static getNumberFromString(n) {
        return parseFloat(n.replace(/[^0-9,-]+/g, '').replace(',', '.'));
    }

}

export default NumberUtils;
