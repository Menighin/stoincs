import DateUtils from './DateUtils';
import fs from 'fs';
import NumberUtils from '../../src-shared/utils/NumberUtils';

class CsvUtils {

    /**
     * Transform a value to a format to be saved in CSV
     * @param {Any} value - Value to be transformed
     */
    static toCsv(value, column) {
        if (column.type === 'float' || column.type === 'integer')
            return `"${NumberUtils.formatNumber(value, '', '', false, 'pt-BR', 2, false)}"`;
        else if (column.type === 'date')
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
                    line.push(this.toCsv(d[h.code], h));
                } catch (error) {
                    console.log('ERROR parsing to CSV: ' + h.code + ' - ' + error.message);
                }
            });
            result.push(line.join(','));
        }

        await fs.promises.writeFile(path, result.join('\n'), { encoding: 'utf-8' });
    }

    static async readCsv(path, columns) {
        const lines = (await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).split('\n');

        const objects = [];
        lines.forEach((line, i) => {
            // Header
            if (i === 0) {
                this.checkHeader(line, columns);
            } else {
                const data = this.getObjectFromLine(line, columns, i);
                objects.push(data);
            }
        });

        return objects;
    }

    static checkHeader(line, columns) {
        const fileHeaders = line.split(',');
        const requiredHeaders = columns.filter(o => o.required !== false).map(o => o.label);
        requiredHeaders.forEach((header, i) => {
            if (header !== fileHeaders[i])
                throw new Error(`Headers do CSV esperados são: ${requiredHeaders.join(', ')}`)
        })
    }

    static getObjectFromLine(line, columns, lineNumber) {
        const lineValues = this.splitLineByComma(line);
        return columns.reduce((p, c, i) => {
            const lineValue = lineValues[i];
            
            if (c.required !== false && !lineValue)
                throw new Error(`Coluna "${c.label}" não pode ser nula (linha ${lineNumber})`)

            try {
                if (c.type === 'integer' || c.type === 'float')
                    p[c.code] = NumberUtils.getNumberFromString(lineValue)
                else if (c.type === 'date')
                    p[c.code] = DateUtils.fromDateStr(lineValue);
                else
                    p[c.code] = lineValue;
            } catch(e) {
                console.log(e.message);
                throw new Error(`Erro ao converter valor da Coluna "${c.label}" (linha ${lineNumber})`)
            }

            return p;
        }, {});
    }

    static splitLineByComma(line){
        const ret = [];
        const arr = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        for (const e of arr) {
            if ('"' === e[0]) {
                ret.push(e.substr(1, e.length - 2));
            } else {
                ret.push(e.trim());
            }
        }
        return ret;
    }
}

export default CsvUtils;
