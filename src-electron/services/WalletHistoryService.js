import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';
import DateUtils from '../../src-shared/utils/DateUtils';

const FILES = {
    WALLET_HISTORY: 'wallet_history',
    JOB_METADATA: 'wallet_history_job'
};

class WalletHistoryService {

    async getWalletHistoryJobMetadata() {
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

    async updateWalletHistoryJobMetadata(lastRun = undefined) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.JOB_METADATA}`;

        const metadata = await this.getWalletHistoryJobMetadata() || {};
        metadata.lastRun = typeof lastRun === 'undefined' ? new Date() : lastRun;
        await fs.promises.writeFile(path, JSON.stringify(metadata));
    }

    async getWalletHistory() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.WALLET_HISTORY}`;
        const walletHistory = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '{}');
        return walletHistory;
    }

    async saveWalletHistoryFromJob(walletData, date) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.WALLET_HISTORY}`;

        const walletHistory = await this.getWalletHistory();

        const stockValues = walletData
            .reduce((p, c) => {
                return [...p, ...c.stockWallet];
            }, [])
            .reduce((p, c) => {
                if (!p[c.code])
                    p[c.code] = { quantity: 0 };
                p[c.code].price = c.price;
                p[c.code].quantity += c.quantity;
                return p;
            }, {});

        const dateStr = DateUtils.toString(date, true, false);
        walletHistory[dateStr] = stockValues;

        await fs.promises.writeFile(path, JSON.stringify(walletHistory));
    }

    async getWalletPerformanceData(startDate, endDate) {
        const walletHistory = await this.getWalletHistory();
        let currentDate = startDate;

        while(currentDate <= endDate) {
            currentDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * 24);
        }
    }

};

export default new WalletHistoryService();
export { FILES as WalletHistoryFiles };
