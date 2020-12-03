import DateUtils from './DateUtils';
import fs from 'fs';
import NumberUtils from '../../src-shared/utils/NumberUtils';

class CsvUtils {

    /**
     * Transform a value to a format to be saved in CSV
     * @param {Any} value - Value to be transformed
     */
    static toCsv(value, column) {
        if (value === null || typeof value === 'undefined') return null;
        if (column.type === 'float')
            return `"${NumberUtils.formatNumber(value, '', '', false, 'pt-BR', 2, false)}"`;
        else if (column.type === 'integer')
            return `"${NumberUtils.formatNumber(value, '', '', false, 'pt-BR', 0, false)}"`;
        else if (column.type === 'date')
            return DateUtils.toString(value, true, true);
        else
            return value.toString();
    }

    static async saveCsv(path, data, columns) {
        const result = [columns.map(o => o.label).join(',')];
        for (const d of data) {
            const line = [];
            columns.forEach(h => {
                line.push(this.toCsv(d[h.code], h));
            });
            result.push(line.join(','));
        }

        await fs.promises.writeFile(path, result.join('\n'), { encoding: 'utf8' });
    }

    static async readCsv(path, columns) {
        const lines = (await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf8' })).split('\n').map(o => o.replace('\r', ''));

        const objects = [];
        lines.forEach((line, i) => {
            // Header
            if (i === 0) {
                this.checkHeader(line, columns);
            } else {
                // Ignore empty lines
                if (line.replace(/,/g, '').replace(/ /g, '').length === 0)
                    return;

                const data = this.getObjectFromLine(line, columns, i);
                objects.push(data);
            }
        });

        return objects;
    }

    static checkHeader(line, columns) {
        const fileHeaders = line.split(',');
        const requiredHeaders = columns.filter(o => o.required !== false).map(o => o.label);

        let i = 0;
        for (const header of fileHeaders) {
            if (columns[i].required) {
                if (header !== columns[i].label)
                    throw new Error(`Headers do CSV esperados são: ${requiredHeaders.join(', ')}`);
            } else {
                while (i < columns.length && header !== columns[i].label) i++;
                if (!columns[i] || header !== columns[i].label)
                    throw new Error(`Headers do CSV esperados são: ${requiredHeaders.join(', ')}`);
            }
            i++;
        }
    }

    static getObjectFromLine(line, columns, lineNumber) {
        const lineValues = this.splitLineByComma(line);
        return columns.reduce((p, c, i) => {
            const lineValue = lineValues[i];

            if (c.required !== false && !lineValue)
                throw new Error(`Coluna "${c.label}" não pode ser nula (linha ${lineNumber})`);

            try {
                if (c.type === 'integer' || c.type === 'float')
                    p[c.code] = NumberUtils.getNumberFromString(lineValue);
                else if (c.type === 'date')
                    p[c.code] = DateUtils.fromDateStr(lineValue.split(' ').first(o => o.includes('/')));
                else
                    p[c.code] = lineValue;
            } catch (e) {
                console.log(e.message);
                throw new Error(`Erro ao converter valor da Coluna "${c.label}" (linha ${lineNumber})`);
            }

            return p;
        }, {});
    }

    static splitLineByComma(line) {
        var reValid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
        var reValue = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;

        // Return NULL if input string is not well formed CSV string.
        if (!reValid.test(line)) return null;

        var a = []; // Initialize array to receive values.
        line.replace(reValue, // "Walk" the string using replace with callback.
            (m0, m1, m2, m3) => {
                // Remove backslash from \' in single quoted values.
                if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));

                // Remove backslash from \" in double quoted values.
                else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
                else if (m3 !== undefined) a.push(m3);
                return ''; // Return empty string.
            });
        // Handle special case of empty last value.
        if (/,\s*$/.test(line)) a.push('');
        return a;
    };

}

export default CsvUtils;
