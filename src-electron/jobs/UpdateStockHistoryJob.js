import CeiCrawler from 'cei-crawler';
import { BrowserWindow } from 'electron';
import StockHistoryService from '../services/StockHistoryService';
import DateUtils from '../utils/DateUtils';
import StockUtils from '../utils/StockUtils';

class UpdateStockHistoryJob {

    /** @type {BrowserWindow} */
    _browserWindow;

    /** @type {StockHistoryService} */
    _stockHistoryService;

    /**
     * Setup the job to run from time to time
     * @param {StockHistoryService} stockHistoryService - Service to handle the stock history
     * @param {BrowserWindow} browserWindow - Main browser window
     */
    setup(stockHistoryService, browserWindow) {
        this._stockHistoryService = stockHistoryService;
        this._browserWindow = browserWindow;
        this.run();
        // setInterval(this.run, 1000 * 3);
    }

    async run() {
        const user = await this._browserWindow.webContents.executeJavaScript('localStorage.getItem("configuration/username");', true);
        const password = await this._browserWindow.webContents.executeJavaScript('localStorage.getItem("configuration/password");', true);

        const jobMetadata = await this._stockHistoryService.getStockHistoryJobMetadata();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const ceiCrawler = new CeiCrawler(user, password, { puppeteerLaunch: { headless: true }, capStartDate: true, capEndDate: true });

        let stocksByAccount = null;
        if (jobMetadata === null) {
            stocksByAccount = await ceiCrawler.getStockHistory();
        } else {
            const lastRun = jobMetadata.lastRun;
            if (!DateUtils.isSameDate(yesterday, lastRun)) {
                stocksByAccount = await ceiCrawler.getStockHistory(lastRun, yesterday);
            } else {
                return;
            }
        }

        // Setting CEI as source and ID for stock Histories
        stocksByAccount.forEach(i => {
            i.stockHistory.forEach(s => {
                s.source = 'CEI';
                s.id = StockUtils.generateId(s, i.account);
            });
        });

        // Merging duplicates
        stocksByAccount.forEach(acc => {
            const stockOperationById = {};
            acc.stockHistory.forEach(s => {
                if (s.id in stockOperationById) {
                    stockOperationById[s.id].totalValue += s.totalValue;
                    stockOperationById[s.id].quantity += s.quantity;
                } else {
                    stockOperationById[s.id] = s;
                }
            });
            acc.stockHistory = Object.values(stockOperationById);
        });

        await this._stockHistoryService.saveStockHistory(stocksByAccount);
        await this._stockHistoryService.updateStockHistoryJobMetadata();
    }

}

export default UpdateStockHistoryJob;
