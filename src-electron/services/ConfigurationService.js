import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';
import WalletService from './WalletService';
import StockHistoryService from './StockHistoryService';
import StockUtils from '../utils/StockUtils';

const FILES = {
    CONFIGURATION: 'configuration'
};

class ConfigurationService {

    async getConfiguration() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.CONFIGURATION}`;

        const configurations = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '{}');
        return configurations;
    }

    async saveConfiguration(configuration) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.CONFIGURATION}`;
        await fs.promises.writeFile(path, JSON.stringify(configuration));
    }

    async getStockOptions() {
        const wallet = await WalletService.getWallet();
        const stockHistory = (await StockHistoryService.getStockHistory()).reduce((p, c) => {
            p = [...p, ...c.stockHistory];
            return p;
        }, []);

        const uniqueWalletStocks = wallet.reduce((p, c) => {
            const code = StockUtils.getStockCode(c.code);
            p[code] = 0;
            return p;
        }, {});

        const uniqueHistoryStocks = stockHistory.reduce((p, c) => {
            const code = StockUtils.getStockCode(c.code);
            p[code] = 0;
            return p;
        }, {});

        return {
            wallet: Object.keys(uniqueWalletStocks).sort(),
            stockHistory: Object.keys(uniqueHistoryStocks).sort()
        };
    }

    async deleteStock(code) {
        const configuration = await this.getConfiguration();
        const index = configuration.priceUpdate.stocks.indexOf(code);
        configuration.priceUpdate.stocks.splice(index, 1);

        await this.saveConfiguration(configuration);
    }

    async addStock(code) {
        const configuration = await this.getConfiguration();
        configuration.priceUpdate.stocks.push(code);
        configuration.priceUpdate.stocks.sort();

        await this.saveConfiguration(configuration);
    }

}

export default new ConfigurationService();
export { FILES as ConfigurationFiles };
