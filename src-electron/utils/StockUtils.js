class StockUtils {

    /**
     * Generate an unique ID for the given stock history item
     * @param {*} stockOperation - The stock operation to generate the ID
     * @param {String} accountNumber - The account number
     * @returns {String} - The ID representing the stock operation
     */
    static generateId(stockOperation, accountNumber) {
        return `${accountNumber}_${stockOperation.date.getDate()}${stockOperation.date.getMonth()}${stockOperation.date.getFullYear()}_` +
        `${stockOperation.operation}_${stockOperation.code}_${stockOperation.source}`;
    }

    /**
     * Strips fractional stock codes. E.g.: PETR4F -> PETR4
     * @param {String} code The code of the stock
     */
    static getStockCode(code) {
        let result = code;
        if (result.match(/\dF$/))
            result = result.slice(0, -1);
        return result;
    }

}

export default StockUtils;
