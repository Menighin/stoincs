class NumberUtils {

    /**
     * Returns number formated as currency
     * @param {Number} n - Number to be formated
     * @param {String} [currency=R$] - Currency to be formated
     * @param {String} [locale=pt-BR] - Locale to be formated
     * @returns {String} - Formated number
     */
    static formatCurrency(n, showSign = false, currency = 'R$', locale = 'pt-BR') {
        if (!showSign)
            return `${currency} ${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const sign = n < 0 ? '' : '+';
        return `${currency} ${sign}${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    /**
     * Returns the number formated as percentage
     * @param {Number} n - Number to be formated
     * @param {String} [locale=pt-BR] - Locale to be formated
     * @param {Boolean} [showSign=true] - Whether to return the sign or not
     * @returns {String} - Formated number
     */
    static formatPercentage(n, showSign = true, locale = 'pt-BR') {
        const sign = showSign ? (n < 0 ? '' : '+') : '';
        return `${sign}${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    }

    /**
     * Format a currency number back to Number
     * @param {String} n - The number with currency
     * @returns {Number} - The number from currency
     */
    static getNumberFromCurrency(n) {
        return parseFloat(n.replace(/[^0-9,]+/g, '').replace(',', '.'));
    }

}

export default NumberUtils;
