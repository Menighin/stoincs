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
        const res = [];
        if (startDate > endDate) throw new Error('Start date should be lower than end date');

        let dayBeforeData = null;
        while ((dayBeforeData === null || dayBeforeData === undefined) && currentDate <= endDate) {
            const key = DateUtils.toString(currentDate, true, false);
            dayBeforeData = walletHistory[key];
            currentDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * 24);
        }

        while (currentDate <= endDate) {
            const key = DateUtils.toString(currentDate, true, false);
            const currentData = walletHistory[key];

            if (currentData) {
                let totalCurrent = 0;
                let totalDayBefore = 0;
                for (const code of Object.keys(dayBeforeData)) {
                    const currentPosition = currentData[code];
                    const dayBeforePosition = dayBeforeData[code];
                    if (currentPosition) {
                        if (!this.hasSplitHappened(dayBeforePosition, currentPosition)) {
                            const quantity = Math.min(dayBeforePosition.quantity, currentPosition.quantity);
                            totalCurrent += quantity * currentPosition.price;
                            totalDayBefore += quantity * dayBeforePosition.price;
                        } else {
                            const dayBeforeAsItWasSplitted = this.getDayBeforePositionAsSplit(dayBeforePosition, currentPosition);
                            const quantity = Math.min(dayBeforeAsItWasSplitted.quantity, currentPosition.quantity);
                            totalCurrent += quantity * currentPosition.price;
                            totalDayBefore += quantity * dayBeforeAsItWasSplitted.price;
                        }
                    }
                }
                if (totalDayBefore > 0) {
                    const variation = (totalCurrent - totalDayBefore);
                    const variationPercentage = (variation / totalDayBefore) * 100;
                    res.push({ date: key, variationPercentage: variationPercentage, variation: variation });
                }
                dayBeforeData = currentData;
            }

            currentDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * 24);
        }

        return res.map((o, i) => {
            let sum = 0;
            let sumPercentage = 0;
            for (let j = 0; j < i; j++) sum += res[j].variation;
            for (let j = 0; j < i; j++) sumPercentage += res[j].variationPercentage;
            return {
                date: o.date,
                variation: sum + o.variation,
                variationPercentage: sumPercentage + o.variationPercentage
            };
        });
    }

    hasSplitHappened(dayBeforePosition, currentPosition) {
        const ratio = dayBeforePosition.price / currentPosition.price;
        return ratio <= 0.5 || ratio >= 2;
    }

    getDayBeforePositionAsSplit(dayBeforePosition, currentPosition) {
        const wasSplit = dayBeforePosition.price > currentPosition.price;
        if (wasSplit) {
            const splitFactor = parseInt(dayBeforePosition.price / currentPosition.price);
            return {
                price: dayBeforePosition.price / splitFactor,
                quantity: dayBeforePosition.quantity * splitFactor
            };
        } else {
            const groupingFactor = parseInt(currentPosition.price / dayBeforePosition.price);
            return {
                price: dayBeforePosition.price * groupingFactor,
                quantity: dayBeforePosition.quantity / groupingFactor
            };
        }
    }

};

export default new WalletHistoryService();
export { FILES as WalletHistoryFiles };
