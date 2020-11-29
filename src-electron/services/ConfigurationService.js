import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';
import WalletService from './WalletService';
import StockHistoryService from './StockHistoryService';
import StockUtils from '../utils/StockUtils';
import UpdatePricesJob from '../jobs/UpdatePricesJob';
import UpdateStockHistoryJob from '../jobs/UpdateStockHistoryJob';
import UpdateTreasuryDirectJob from '../jobs/UpdateTreasuryDirectJob';
import UpdateDividendsJob from '../jobs/UpdateDividendsJob';
import UpdateWalletHistoryJob from '../jobs/UpdateWalletHistoryJob';
import CeiCrawlerService from '../services/CeiCrawlerService';
import ObjectUtils from '../../src-shared/utils/ObjectUtils';

const FILES = {
    CONFIGURATION: 'configuration'
};

class ConfigurationService {

    async getConfiguration() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.CONFIGURATION}`;

        const configurations = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '{}');

        // Setting default values
        if (!configurations.username) configurations.username = '';
        if (!configurations.password) configurations.password = '';
        if (!configurations.alphaVantageKey) configurations.alphaVantageKey = '';
        if (!configurations.hgBrasilKey) configurations.hgBrasilKey = '';
        if (!configurations.priceUpdate) configurations.priceUpdate = {};
        if (!configurations.ceiConfig) configurations.ceiConfig = {};

        if (!configurations.priceUpdate.updatePriceApi) configurations.priceUpdate.updatePriceApi = 'crawler';
        if (typeof configurations.priceUpdate.auto === 'undefined') configurations.priceUpdate.auto = true;
        if (!configurations.priceUpdate.many) configurations.priceUpdate.many = 1;
        if (!configurations.priceUpdate.when) configurations.priceUpdate.when = 1;
        if (!configurations.priceUpdate.startTime) configurations.priceUpdate.startTime = '00:00';
        if (!configurations.priceUpdate.endTime) configurations.priceUpdate.endTime = '00:00';

        if (typeof configurations.ceiConfig.stockHistory === 'undefined') configurations.ceiConfig.stockHistory = true;
        if (typeof configurations.ceiConfig.dividends === 'undefined') configurations.ceiConfig.dividends = true;
        if (typeof configurations.ceiConfig.treasuryDirect === 'undefined') configurations.ceiConfig.treasuryDirect = true;
        if (typeof configurations.ceiConfig.walletHistory === 'undefined') configurations.ceiConfig.walletHistory = true;

        return configurations;
    }

    async saveConfiguration(configuration, restartJobs = true) {
        // Get old configurations
        const oldConfiguration = await this.getConfiguration();
        const newConfiguration = ObjectUtils.mergeUpdating(oldConfiguration, configuration);

        // Save file
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.CONFIGURATION}`;
        await fs.promises.writeFile(path, JSON.stringify(newConfiguration));

        // Restart jobs and configurations
        if (restartJobs) {
            await CeiCrawlerService.freeUpInstance(true);
            await UpdatePricesJob.updateConfig();
            UpdateStockHistoryJob.run();
            UpdateTreasuryDirectJob.run();
            UpdateDividendsJob.run();
            UpdateWalletHistoryJob.run();
        }
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

    async updateAutoUpdatePrice(value) {
        const configuration = await this.getConfiguration();
        if (!configuration.priceUpdate)
            configuration.priceUpdate = {};
        configuration.priceUpdate.auto = value;
        await this.saveConfiguration(configuration, false);
        await UpdatePricesJob.updateConfig();
    }

}

export default new ConfigurationService();
export { FILES as ConfigurationFiles };
