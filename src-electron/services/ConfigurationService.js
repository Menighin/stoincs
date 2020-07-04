import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';
import WalletService from './WalletService';
import StockHistoryService from './StockHistoryService';
import StockUtils from '../utils/StockUtils';
import UpdatePricesJob from '../jobs/UpdatePricesJob';
import UpdateStockHistoryJob from '../jobs/UpdateStockHistoryJob';
import UpdateTreasuryDirectJob from '../jobs/UpdateTreasuryDirectJob';
import CeiCrawlerService from '../services/CeiCrawlerService';

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
        // Save file
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.CONFIGURATION}`;
        await fs.promises.writeFile(path, JSON.stringify(configuration));

        // Restart jobs and configurations
        await CeiCrawlerService.freeUpInstance(true);
        await UpdatePricesJob.updateConfig();
        UpdateStockHistoryJob.run();
        UpdateTreasuryDirectJob.run();
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

}

export default new ConfigurationService();
export { FILES as ConfigurationFiles };
