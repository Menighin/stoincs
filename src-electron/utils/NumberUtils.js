class NumberUtils {

    /**
     * Returns number formated as currency
     * @param {Number} n - Number to be formated
     * @param {String} [currency=R$] - Currency to be formated
     * @param {String} [locale=pt-BR] - Locale to be formated
     * @returns {String} - Formated number
     */
    static formatCurrency(n, currency = 'R$', locale = 'pt-BR') {
        return `${currency} ${n.toLocaleString(locale, { minimumFractionDigits: 2 })}`;
    }

}

export default NumberUtils;
