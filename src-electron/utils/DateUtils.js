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
        if (!dateStr) return null;
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

    /**
     * Return the minutes formated as XhYm. E.g.: 100 => 1h40m
     * @param {Number} n The total seconds
     */
    static getFormatedHoursFromSeconds(n, showHours = true, showMinutes = true, showSeconds = true) {
        let secondsLeft = n;
        const hours = parseInt(n / 3600);
        secondsLeft -= hours * 3600;

        const minutes = parseInt(secondsLeft / 60);
        secondsLeft -= minutes * 60;
        const seconds = secondsLeft;

        let res = '';
        if (showHours)
            res += `${hours.toString().padStart(2, '0')}h`;
        if (showMinutes)
            res += `${minutes.toString().padStart(2, '0')}m`;
        if (showSeconds)
            res += `${seconds.toString().padStart(2, '0')}s`;
        return res;
    }

    /**
     * Calculats, how many minutes are between t1 and t2. If t2 is lower than t1, t2 is considered to be on the next day
     * @param {String} t1 String representing the start hour
     * @param {String} t2 String representing the end hour
     */
    static minutesBetweenTimes(t1, t2) {
        if (t1 === t2) return 60 * 24;

        const [h1, m1] = t1.split(':').map(o => parseInt(o));
        const [h2, m2] = t2.split(':').map(o => parseInt(o));

        const d1 = new Date();
        d1.setHours(h1);
        d1.setMinutes(m1);

        const d2 = new Date();
        if (h2 < h1 || (h2 === h1 && m2 < m1))
            d2.setTime(d2.getTime() + 1000 * 60 * 60 * 24);
        d2.setHours(h2);
        d2.setMinutes(m2);

        return parseInt((d2.getTime() - d1.getTime()) / (1000 * 60));
    }

}

export default DateUtils;
