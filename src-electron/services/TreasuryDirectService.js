import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';
import CsvUtils from '../../src-shared/utils/CsvUtils';
import { dialog } from 'electron';
import { isBuffer } from 'util';

const FILES = {
    TREASURY_DIRECT: 'treasury_direct',
    JOB_METADATA: 'treasury_direct_job'
};

const CSV_HEADERS = [
    {
        code: 'account',
        label: 'Conta'
    },
    {
        code: 'institution',
        label: 'Instituição'
    },
    {
        code: 'code',
        label: 'Titulo'
    },
    {
        code: 'grossValue',
        label: 'Valor Bruto'
    },
    {
        code: 'netValue',
        label: 'Valor Líquido'
    },
    {
        code: 'date',
        label: 'Data do Pagamento'
    },
    {
        code: 'source',
        label: 'Fonte'
    }
];

class TreasuryDirectService {

    async getTreasuryDirectJobMetadata() {
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

    async updateTreasuryDirectJobMetadata(lastRun = undefined) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.JOB_METADATA}`;

        const metadata = await this.getTreasuryDirectJobMetadata() || {};
        metadata.lastRun = typeof lastRun === 'undefined' ? new Date() : lastRun;
        await fs.promises.writeFile(path, JSON.stringify(metadata));
    }

    async getTreasuryDirect() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.TREASURY_DIRECT}`;

        const treasuryDirect = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '[]');
        treasuryDirect.forEach(t => {
            t.expirationDate = new Date(t.expirationDate);
        });
        return treasuryDirect;
    }

    async getTreasuryDirectFlat() {
        const treasuryDirect = await this.getTreasuryDirect();
        return treasuryDirect.reduce((p, c) => {
            c.data.forEach(d => {
                p.push({
                    institution: c.institution,
                    account: c.account,
                    code: d.code,
                    expirationDate: new Date(d.expirationDate),
                    investedValue: d.investedValue,
                    grossValue: d.grossValue,
                    netValue: d.netValue,
                    quantity: d.quantity,
                    lastUpdated: new Date(d.lastUpdated),
                    source: d.source
                });
            });
            return p;
        }, []);
    }

    async saveTreasuryDirect(treasuryDirect) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.TREASURY_DIRECT}`;
        await fs.promises.writeFile(path, JSON.stringify(treasuryDirect));
    }

    async saveTreasuryDirectFromJob(treasuryDirect) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.TREASURY_DIRECT}`;
        const data = (await this.getTreasuryDirect())
            .reduce((p, c) => {
                const key = `${c.institution}-${c.account}`;
                c.data = c.data.filter(o => o.source !== 'CEI');
                p[key] = c;
                return p;
            }, {});
        
        for (const acc of treasuryDirect) {
            const key = `${acc.institution}-${acc.account}`;
            if (!data[key])
                data[key] = {
                    institution: acc.institution,
                    account: acc.account,
                    data: []
                };
            acc.data.forEach(d => data[key].data.push(d))
        }
        
        await fs.promises.writeFile(path, JSON.stringify(Object.values(data)));
    }

    async saveNewOperation(newOperation) {
        const data = await this.getTreasuryDirect();
        const newOperationCopy = { ...newOperation, lastUpdated: new Date(), source: 'Manual' };
        delete newOperationCopy['institution'];
        delete newOperationCopy['account'];

        const account = data.first(o => o.institution === newOperation.institution && o.account === newOperation.account);
        if (account)
            account.data.push(newOperationCopy)
        else {
            data.push({
                institution: newOperation.institution,
                account: newOperation.account,
                data: [newOperationCopy]
            });
        }

        await this.saveTreasuryDirect(data);
    }

    async delete(treasuryDirect) {
        const data = await this.getTreasuryDirect();

        for (const acc of data) {
            if (acc.institution === treasuryDirect.institution && acc.account === treasuryDirect.account) {
                acc.data = acc.data.dropFirst(o => 
                    o.code === treasuryDirect.code 
                    && o.quantity === treasuryDirect.quantity 
                    && o.investedValue === treasuryDirect.investedValue);
                break;
            }
        }

        await this.saveTreasuryDirect(data);
    }

    async downloadCsv() {
        const savePath = await dialog.showSaveDialog({ defaultPath: 'stoincs-dividendos.csv' });
        if (!savePath.canceled) {
            const data = await this.getDividendsEvents();
            await CsvUtils.saveCsv(savePath.filePath, data, CSV_HEADERS);
        }
    }

};

export default new TreasuryDirectService();
export { FILES as TreasuryDirectFiles };
