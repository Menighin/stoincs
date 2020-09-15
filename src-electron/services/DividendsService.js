import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';
import CsvUtils from '../../src-shared/utils/CsvUtils';
import { dialog } from 'electron';

const FILES = {
    DIVIDENDS: 'dividends',
    JOB_METADATA: 'dividends_job'
};

const CSV_HEADERS = [
    {
        code: 'account',
        label: 'Conta',
        type: 'string'
    },
    {
        code: 'institution',
        label: 'Instituição',
        type: 'string'
    },
    {
        code: 'code',
        label: 'Ativo',
        type: 'string'
    },
    {
        code: 'type',
        label: 'Tipo',
        type: 'string'
    },
    {
        code: 'stockType',
        label: 'Tipo do Ativo',
        type: 'string'
    },
    {
        code: 'quantity',
        label: 'Quantidade',
        type: 'integer'
    },
    {
        code: 'date',
        label: 'Data do Pagamento',
        type: 'date'
    },
    {
        code: 'grossValue',
        label: 'Valor Bruto',
        type: 'float'
    },
    {
        code: 'netValue',
        label: 'Valor Líquido',
        type: 'float'
    },
    {
        code: 'source',
        label: 'Fonte',
        type: 'string',
        required: false
    }
];

class DividendsService {

    _compareDividendOrder = (a, b) => {
        if (a.date === null) return -1;
        if (b.date === null) return 1;
        return b.date.getTime() - a.date.getTime();
    };

    async saveDividends(dividends) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.DIVIDENDS}`;
        await fs.promises.writeFile(path, JSON.stringify(dividends));
    }

    async getDividendsJobMetadata() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.JOB_METADATA}`;

        const fileStr = (await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString();
        let result = null;
        if (fileStr.length > 0) {
            result = JSON.parse(fileStr);
            result.lastRun = new Date(result.lastRun);
        }
        return result;
    }

    async updateDividendsJobMetadata(lastRun = undefined) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.JOB_METADATA}`;

        const metadata = await this.getDividendsJobMetadata() || {};
        metadata.lastRun = typeof lastRun === 'undefined' ? new Date() : lastRun;
        await fs.promises.writeFile(path, JSON.stringify(metadata));
    }

    async getDividends() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.DIVIDENDS}`;

        const dividends = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '[]');
        dividends.forEach(d => {
            d.data.forEach(e => {
                if (e.date)
                    e.date = new Date(e.date);
            });
        });
        return dividends;
    }

    async getDividendsEvents() {
        const now = new Date();
        return (await this.getDividends())
            .reduce((p, c) => {
                const data = c.data.map(e => {
                    const date = e.date ? new Date(e.date) : null;
                    return {
                        ...e,
                        date: date,
                        institution: c.institution,
                        account: c.account,
                        isFuture: date === null || date.getTime() > now.getTime()
                    }
                });

                p = [
                    ...p,
                    ...data
                ];
                return p;
            }, [])
            .sort(this._compareDividendOrder);
    }

    async saveDividendsFromJob(dividendsCei) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.DIVIDENDS}`;
        const dividends = await this.getDividends();
        let newDividends = 0;
        dividendsCei.forEach(cei => {
            const alreadyExistsAccount = dividends
                .any(d => d.institution === cei.institution && d.account === cei.account);

            const savedAccount = alreadyExistsAccount
                ? dividends.first(d => d.institution === cei.institution && d.account === cei.account)
                : {
                    institution: cei.institution,
                    account: cei.account,
                    data: []
                };

            // If there's no dividend data for this account and institution, add it
            if (!alreadyExistsAccount) dividends.push(savedAccount);

            // Clear out future events (the one that has no ID)
            savedAccount.data = savedAccount.data.filter(o => typeof o.id !== 'undefined');

            cei.pastEvents.forEach(e => {
                const id = this.getEventId(e);
                if (!savedAccount.data.any(o => o.id === id)) {
                    newDividends++;
                    savedAccount.data.push({
                        id: id,
                        code: e.code,
                        stockType: e.stockType,
                        type: e.type,
                        quantity: e.quantity,
                        date: e.date,
                        grossValue: e.grossValue,
                        netValue: e.netValue,
                        source: 'CEI'
                    });
                }
            });
            savedAccount.data = [...cei.futureEvents.map(e => ({
                code: e.code,
                stockType: e.stockType,
                type: e.type,
                quantity: e.quantity,
                date: e.date,
                grossValue: e.grossValue,
                netValue: e.netValue,
                source: 'CEI'
            })), ...savedAccount.data];
        });

        dividends.forEach(d => {
            d.data.sort(this._compareDividendOrder);
        });

        await fs.promises.writeFile(path, JSON.stringify(dividends));
        return newDividends;
    }
    
    async save(newDividend) {
        const data = await this.getDividends();

        const existsAccount = data.any(d => d.institution === newDividend.institution && d.account === newDividend.account);

        const savedAccount = existsAccount
        ? data.first(d => d.institution === newDividend.institution && d.account === newDividend.account)
        : {
            institution: newDividend.institution,
            account: newDividend.account,
            data: []
        };

        if (!existsAccount)
            data.push(savedAccount);

        if (newDividend.date)
            newDividend.date = new Date(newDividend.date);
        newDividend.source = 'Manual';
        
        const id = this.getEventId(newDividend);
        delete newDividend['institution'];
        delete newDividend['account'];

        newDividend.id = id;

        if (savedAccount.data.any(o => o.id === id))
            return false;
        
        savedAccount.data.push(newDividend);

        await this.saveDividends(data);
        return true;
    }

    async saveFromCsv(operations) {
        const data = await this.getDividends();

        for (let operation of operations) {
            const id = this.getEventId(operation);
            const operationCopy = { id: id, ...operation, source: 'Manual' };
            delete operationCopy['institution'];
            delete operationCopy['account'];
    
            const account = data.first(o => o.institution === operation.institution && o.account === operation.account);
            if (account) {
                const alreadyExists = account.data.first(o => o.id === id);
                if (alreadyExists) {
                    alreadyExists.stockType = operation.stockType;
                    alreadyExists.type = operation.type;
                    alreadyExists.source = 'Manual';
                }
                else
                    account.data.push(operationCopy)
            } else {
                data.push({
                    institution: newOperation.institution,
                    account: newOperation.account,
                    data: [operationCopy]
                });
            }
        }

        await this.saveDividends(data);
    }

    async delete(dividend) {
        const data = await this.getDividends();
        if (dividend.date)
            dividend.date = new Date(dividend.date);

        const account = data.first(o => o.account === dividend.account && o.institution === dividend.institution);
        account.data = account.data.dropFirst(o => this.getEventId(o) === this.getEventId(dividend));

        await this.saveDividends(data);
    }

    async downloadCsv() {
        const savePath = await dialog.showSaveDialog({ defaultPath: 'stoincs-dividendos.csv' });
        if (!savePath.canceled) {
            try {
            const data = await this.getDividendsEvents();
            await CsvUtils.saveCsv(savePath.filePath, data, CSV_HEADERS);
            } catch (e) {
                console.log(e.message);
                console.log(e.stack);
            }
        }
    }

    async uploadCsv() {
        const openPaths = await dialog.showOpenDialog({ filters: [{ name: 'csv', extensions: ['csv'] }]});
        if (!openPaths.canceled) {
            let lines = 0;
            for (const path of openPaths.filePaths) {
                const data = await CsvUtils.readCsv(path, CSV_HEADERS);
                await this.saveFromCsv(data);
                lines += data.length
            }
            return lines;
        } else {
            return -1;
        }
    }

    getEventId(e) {
        if (e.date)
            return `${e.code}_${e.quantity}_${e.netValue}_${e.grossValue}_${e.date.getFullYear()}${e.date.getMonth()}${e.date.getDate()}_${e.source}`;
        return `${e.code}_${e.quantity}_${e.netValue}_${e.grossValue}_undefined_${e.source}`;
    }

};

export default new DividendsService();
export { FILES as DividendsFiles };
