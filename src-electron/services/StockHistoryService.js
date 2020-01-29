import fs from 'fs';
import { app } from 'electron';

const FILES = {
    JOB_METADATA: 'stock_history_job',
    STOCK_HISTORY: 'stock_history'
};

class StockHistoryService {

    async getPath() {
        const path = `${app.getAppPath()}/data`;
        await fs.promises.stat(path).catch(async () => {
            await fs.promises.mkdir(path);
        });
        return path;
    }

    async getStockHistoryJobMetadata() {
        const rootPath = await this.getPath();
        const path = `${rootPath}/${FILES.JOB_METADATA}`;

        const fileStr = (await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString();
        let result = null;
        if (fileStr.length > 0) {
            result = JSON.parse(fileStr);
            result.lastRun = new Date(result.lastRun);
        }
        return result;
    }

    async updateStockHistoryJobMetadata() {
        const rootPath = await this.getPath();
        const path = `${rootPath}/${FILES.JOB_METADATA}`;

        const metadata = await this.getStockHistoryJobMetadata() || {};
        metadata.lastRun = new Date();
        await fs.promises.writeFile(path, JSON.stringify(metadata));
    }

    async saveStockHistory(stocks) {
        const rootPath = await this.getPath();
        const path = `${rootPath}/${FILES.STOCK_HISTORY}`;

        // Save history
        await this.updateStockHistoryJobMetadata();

        // Reading data
        const stockHistory = (await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || [];

        // Merging / appending data
        for (const newStock of stocks) {
            let alreadySaved = false;
            for (const savedStock of stockHistory) {
                if (newStock.institution === savedStock.institution && newStock.account === savedStock.account) {
                    // Do the thing
                }
            }
        }

        // Writing data
        await fs.promises.writeFile(path, JSON.stringify(stocks));
    }

}

export default StockHistoryService;
