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

    /**
     * Returns a date object from string
     * @param {String} dateStr - Date string in format dd/MM/yyyy
     * @returns {Date} - The date object from string
     */
    static fromDateStr(dateStr) {
        const [day, month, year] = dateStr.split('/').map(c => parseInt(c));
        return new Date(year, month - 1, day);
    }

    /**
     * Format the date to the given format
     * @param {Date} date - Date to be formated
     * @param {boolean} [showDate=true] - Whether it should print the date
     * @param {boolean} [showTime =true] - Whether it should print the time
     * @return {String} - The formatted date
     */
    static toString(date, showDate = true, showTime = true) {
        const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

        if (showDate && showTime)
            return `${dateStr} ${timeStr}`;
        if (showDate)
            return dateStr;
        if (showTime)
            return timeStr;
    }

}

export default DateUtils;
