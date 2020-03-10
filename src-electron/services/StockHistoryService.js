import fs from 'fs';
import StockUtils from '../utils/StockUtils';
import FileSystemUtils from '../utils/FileSystemUtils';
import UpdateStockHistoryJob from '../jobs/UpdateStockHistoryJob';

const FILES = {
    JOB_METADATA: 'stock_history_job',
    STOCK_HISTORY: 'stock_history'
};

class StockHistoryService {

    async getStockHistoryJobMetadata() {
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

    async updateStockHistoryJobMetadata(lastRun = undefined) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.JOB_METADATA}`;

        const metadata = await this.getStockHistoryJobMetadata() || {};
        metadata.lastRun = typeof lastRun === 'undefined' ? new Date() : lastRun;
        await fs.promises.writeFile(path, JSON.stringify(metadata));
    }

    async saveStockHistory(stocks, overwrite = false) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.STOCK_HISTORY}`;

        if (!overwrite) {
            // Reading data
            const stockHistory = await this.getStockHistory();

            // Merging / appending data
            for (const newStock of stocks) {
                let alreadySaved = false;
                for (const savedStock of stockHistory) {
                    if (newStock.institution === savedStock.institution && newStock.account === savedStock.account) {
                        for (const newOperation of newStock.stockHistory) {
                            let foundOperation = false;
                            for (let i = 0; i < savedStock.stockHistory.length; i++) {
                                if (savedStock.stockHistory[i].id === newOperation.id) {
                                    savedStock.stockHistory[i] = newOperation;
                                    foundOperation = true;
                                    break;
                                }
                            }
                            if (!foundOperation)
                                savedStock.stockHistory.push(newOperation);
                        }
                        alreadySaved = true;
                    }
                }
                // If this is a new item, simply push it
                if (!alreadySaved) {
                    stockHistory.push(newStock);
                }
            }

            // Writing data
            await fs.promises.writeFile(path, JSON.stringify(stockHistory));
        } else {
            await fs.promises.writeFile(path, JSON.stringify(stocks));
        }
    }

    async getStockHistory() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.STOCK_HISTORY}`;

        const stockHistory = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '[]');
        return stockHistory;
    }

    async deleteStockOperation(id) {
        const stockHistory = await this.getStockHistory();

        accountLoop:
        for (const account of stockHistory) {
            for (let i = 0; i < account.stockHistory.length; i++) {
                const stockOperation = account.stockHistory[i];
                if (stockOperation.id === id) {
                    account.stockHistory.splice(i, 1);
                    break accountLoop;
                }
            }
        }

        this.saveStockHistory(stockHistory, true);
    }

    async updateStockOperation(stockOperation) {
        const stockHistory = await this.getStockHistory();

        searchId:
        for (const account of stockHistory) {
            if (account.account === stockOperation.account && account.institution === stockOperation.institution) {
                for (let i = 0; i < account.stockHistory.length; i++) {
                    if (account.stockHistory[i].id === stockOperation.id) {
                        delete stockOperation.account;
                        delete stockOperation.institution;
                        stockOperation.source = account.stockHistory[i].source;
                        account.stockHistory[i] = stockOperation;
                        console.log(stockOperation);
                        break searchId;
                    }
                }
            }
        }

        this.saveStockHistory(stockHistory, true);

        return stockOperation;
    }

    async createStockOperation(stockOperation) {
        const stockHistory = await this.getStockHistory();
        let found = false;
        stockOperation.id = StockUtils.generateId(stockOperation, stockOperation.account);
        stockOperation.source = 'Manual';
        for (const account of stockHistory) {
            if (account.account === stockOperation.account && account.institution === stockOperation.institution) {
                for (const s of account.stockHistory) {
                    if (s.id === stockOperation.id)
                        throw new Error('Operação já existente');
                }

                delete stockOperation.account;
                delete stockOperation.institution;
                account.stockHistory.push(stockOperation);
                found = true;
            }
        }

        if (!found) {
            const newAccount = {
                account: stockOperation.account,
                institution: stockOperation.institution
            };

            delete stockOperation.account;
            delete stockOperation.institution;
            newAccount.stockHistory = [stockOperation];
            stockHistory.push(newAccount);
        }

        this.saveStockHistory(stockHistory, true);

        return stockOperation;
    }

    async refreshHistory() {
        await this.updateStockHistoryJobMetadata(null);

        // Clearing history
        const stockHistory = await this.getStockHistory();
        stockHistory.forEach(acc => {
            acc.stockHistory = acc.stockHistory.filter(o => o.source && o.source !== 'CEI');
        });
        await this.saveStockHistory(stockHistory, true);

        new UpdateStockHistoryJob().run();
    }

}

export default StockHistoryService;
