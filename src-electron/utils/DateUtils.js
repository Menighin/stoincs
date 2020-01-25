class DateUtils {

    /**
     * Compare two dates to check if they are in the same day, month and year
     * @param {Date} d1 - Date to be compared
     * @param {Date} d2 - Date to be compared
     * @returns {Boolean} - Whether it is the same day or not
     */
    static isSameDate(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

}

export default DateUtils;
