import DateUtils from './DateUtils';
import fs from 'fs';

class CsvUtils {

    /**
     * Transform a value to a format to be saved in CSV
     * @param {Any} value - Value to be transformed
     */
    static toCsv(value) {
        if (value instanceof Date)
            return DateUtils.toString(value, true, true);
        else if (value != null)
            return value.toString();
        else
            return value;
    }

    static async saveCsv(path, data, columns) {
        const result = [columns.map(o => o.label).join(",")];
        for (const d of data) {
            const line = [];
            columns.forEach(h => {
                try {
                    line.push(this.toCsv(d[h.code]));
                } catch (error) {
                    console.log('ERROR parsing to CSV: ' + h.code + ' - ' + error.message);
                }
            });
            result.push(line.join(','));
        }

        await fs.promises.writeFile(path, result.join('\n'), { encoding: 'utf-8' });
    }
}

export default CsvUtils;
