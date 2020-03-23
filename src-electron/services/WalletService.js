import fs from 'fs';
import StockHistoryService from './StockHistoryService';
import AlphaVantageService from './AlphaVantageService';
import FileSystemUtils from '../utils/FileSystemUtils';

const FILES = {
    STOCKS_WALLET: 'wallet'
};

class WalletService {

    constructor() {
        this.stockHistoryService = new StockHistoryService();
        this.alphaVantageService = new AlphaVantageService();
    }

    async getWallet() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.STOCKS_WALLET}`;

        const wallet = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '[]');
        return wallet;
    }

    async refreshWalletFromHistory() {
        const stockHistory = await this.stockHistoryService.getStockHistory();
        let wallet = (await this.getWallet()).filter(o => o.source !== 'CEI');

        const dataByStock = {};
        for (const acc of stockHistory) {
            for (const stockOperation of acc.stockHistory) {
                // If it is a Fracionary stock, trimm the last 'F'
                let code = stockOperation.code;
                if (code.match(/\dF$/) != null)
                    code = code.slice(0, -1);

                if (!(code in dataByStock)) {
                    dataByStock[code] = {
                        code: code,
                        quantityBought: 0,
                        quantitySold: 0,
                        valueBought: 0,
                        valueSold: 0,
                        price: 0,
                        changePrice: 0,
                        changePercent: 0,
                        lastTradingDay: null,
                        lastUpdated: null,
                        source: 'CEI'
                    };
                }

                if (stockOperation.operation === 'C') {
                    dataByStock[code].quantityBought += stockOperation.quantity;
                    dataByStock[code].valueBought += stockOperation.totalValue;
                } else {
                    dataByStock[code].quantitySold += stockOperation.quantity;
                    dataByStock[code].valueSold += stockOperation.totalValue;
                }
            }
        }

        wallet = [...wallet, ...Object.values(dataByStock)];

        await this.saveWallet(wallet, true);
    }

    async saveWallet(wallet, overwrite = false) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.STOCKS_WALLET}`;

        if (overwrite) {
            await fs.promises.writeFile(path, JSON.stringify(wallet));
        } else {
            const oldWallet = await this.getWallet();
            for (const w of wallet)
                oldWallet.push(w);
            await fs.promises.writeFile(path, JSON.stringify(oldWallet));
        }
    }

    async updateLastValues(stocks) {
        const promises = stocks.map(s => this.alphaVantageService.getLastValue(s));

        const results = (await Promise.all(promises)).filter(o => o !== null);

        const wallet = await this.getWallet();
        const now = new Date();

        for (const r of results) {
            for (const w of wallet) {
                if (r.code === w.code && r.status === 'success') {
                    w.price = r.price;
                    w.changePrice = r.changePrice;
                    w.changePercent = r.changePercent;
                    w.lastTradingDay = r.lastTradingDay;
                    w.lastUpdated = now;
                    r.lastUpdated = now;
                    break;
                }
            }
        }

        await this.saveWallet(wallet, true);

        return results;
    }

}

export default WalletService;
export { FILES as WalletFiles };
