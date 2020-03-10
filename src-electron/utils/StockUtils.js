import typedefs from 'cei-crawler/src/lib/typedefs';

class StockUtils {

    /**
     * Generate an unique ID for the given stock history item
     * @param {typedefs.StockOperation} stockOperation - The stock operation to generate the ID
     * @param {String} accountNumber - The account number
     * @returns {String} - The ID representing the stock operation
     */
    static generateId(stockOperation, accountNumber) {
        return `${accountNumber}_${stockOperation.date.getDate()}${stockOperation.date.getMonth()}${stockOperation.date.getFullYear()}_` +
        `${stockOperation.operation}_${stockOperation.code}_${stockOperation.source}`;
    }

}

export default StockUtils;
