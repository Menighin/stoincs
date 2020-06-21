import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';
import AlphaVantageService from './AlphaVantageService';

const FILES = {
    STOCK_PRICES: 'stock_prices'
};

class StockPriceService {

    async getStockPrices() {
        const rootPath = await FileSystemUtils.getDataPath();
        console.log(rootPath);
        const path = `${rootPath}/${FILES.STOCK_PRICES}`;

        const stockPrices = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '[]');
        return stockPrices;
    }

    async saveStockPrices(stockPrices) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.STOCK_PRICES}`;
        await fs.promises.writeFile(path, JSON.stringify(stockPrices));
    }

    async updateStockPrices(stocks) {
        console.log(`Updating stocks ${stocks.join(', ')}...`);

        const promises = stocks.map(s => AlphaVantageService.getLastValue(s));

        const results = (await Promise.all(promises)).filter(o => o !== null);

        const stockPrices = await this.getStockPrices();
        const now = new Date();

        for (const r of results) {
            let found = false;
            for (const s of stockPrices) {
                if (r.code === s.code && r.status === 'success') {
                    s.price = r.price;
                    s.changePrice = r.changePrice;
                    s.changePercent = r.changePercent;
                    s.lastTradingDay = r.lastTradingDay;
                    s.lastUpdated = now;
                    found = true;
                    break;
                }
            }
            if (!found)
                stockPrices.push({
                    code: r.code,
                    changePrice: r.changePrice,
                    changePercent: r.changePercent,
                    lastTradingDay: r.lastTradingDay,
                    lastUpdated: now
                });
            r.lastUpdated = now;
        }

        await this.saveStockPrices(stockPrices);

        return results;
    }

    async updateStockPricesConfiguration(stocks) {
        const stockPrices = await this.getStockPrices();
        stockPrices.forEach(o => { o.shouldUpdate = false }); // Set everything to false

        // Set the ones to true
        stocks.forEach(s => {
            const stockPrice = stockPrices.filter(o => o.code === s)[0] || {
                code: s,
                shouldUpdate: true
            };
            stockPrice.shouldUpdate = true;
        });

        await this.saveStockPrices(stockPrices);
    }

}

export default new StockPriceService();
export { FILES as StockHistoryFiles };
