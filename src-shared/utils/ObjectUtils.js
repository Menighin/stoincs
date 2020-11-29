class ObjectUtils {

    /**
     * Merge the objects in a single one with o2 properties if defined
     * @param {Object} o1 - the base object with all properties defined
     * @param {Object} o2 - a new version of the object with some or all properties defined with new values
     * @returns {Object} - The merging of both objects
     */
    static mergeUpdating(o1, o2) {
        if (o2 === null || typeof o2 === 'undefined') return JSON.parse(JSON.stringify(o1));

        const res = {};

        for (const k in o1) {
            const dataBase = o1[k];
            const dataNew = o2[k];
            if (this.isObject(dataBase)) {
                res[k] = this.mergeUpdating(dataBase, dataNew);
            } else {
                if (typeof dataNew !== 'undefined')
                    res[k] = dataNew;
                else
                    res[k] = dataBase;
            }
        }

        return res;
    }

    static isObject(o) {
        return Object.prototype.toString.call(o) === '[object Object]' &&
            o.constructor && o.constructor.name === 'Object';
    }

}

export default ObjectUtils;
