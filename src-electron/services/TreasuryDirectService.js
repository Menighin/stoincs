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
        code: 'institution',
        label: 'Instituição',
        type: 'string'
    },
    {
        code: 'account',
        label: 'Conta',
        type: 'string'
    },
    {
        code: 'code',
        label: 'Titulo',
        type: 'string'
    },
    {
        code: 'quantity',
        label: 'Quantidade',
        type: 'float'
    },
    {
        code: 'investedValue',
        label: 'Valor Investido',
        type: 'float'
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
        code: 'expirationDate',
        label: 'Data de Vencimento',
        type: 'date'
    },
    {
        code: 'source',
        label: 'Fonte',
        type: 'string',
        required: false
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
        if (account) {
            if (account.data.any(o => o.code === newOperation.code))
                return false;
            account.data.push(newOperationCopy)
        } else {
            data.push({
                institution: newOperation.institution,
                account: newOperation.account,
                data: [newOperationCopy]
            });
        }

        await this.saveTreasuryDirect(data);
        return true;
    }

    async updateOperation(operation) {
        const data = await this.getTreasuryDirect();

        const account = data.first(o => o.institution === operation.institution && o.account === operation.account);
        const savedOperation = account.data.first(o => o.code === operation.code);
        savedOperation.source = 'Manual';
        savedOperation.quantity = operation.quantity;
        savedOperation.investedValue = operation.investedValue;
        savedOperation.grossValue = operation.grossValue;
        savedOperation.netValue = operation.netValue;
        savedOperation.expirationDate = operation.expirationDate;

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

    async saveFromCsv(operations) {
        const data = await this.getTreasuryDirect();

        for (let operation of operations) {
            const operationCopy = { ...operation, lastUpdated: new Date(), source: 'Manual' };
            delete operationCopy['institution'];
            delete operationCopy['account'];
    
            const account = data.first(o => o.institution === operation.institution && o.account === operation.account);
            if (account) {
                const alreadyExists = account.data.first(o => o.code === operation.code);
                if (alreadyExists) {
                    alreadyExists.quantity = operation.quantity;
                    alreadyExists.investedValue = operation.investedValue;
                    alreadyExists.grossValue = operation.grossValue;
                    alreadyExists.netValue = operation.netValue;
                    alreadyExists.expirationDate = operation.expirationDate;
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

        await this.saveTreasuryDirect(data);
    }

    async downloadCsv() {
        const savePath = await dialog.showSaveDialog({ defaultPath: 'stoincs-tesouro-direto.csv' });
        if (!savePath.canceled) {
            const data = await this.getTreasuryDirectFlat();
            await CsvUtils.saveCsv(savePath.filePath, data, CSV_HEADERS);
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

};

export default new TreasuryDirectService();
export { FILES as TreasuryDirectFiles };
