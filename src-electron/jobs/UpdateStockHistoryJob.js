import CeiCrawler from 'cei-crawler';
import { BrowserWindow } from 'electron';
import StockHistoryService from '../services/StockHistoryService';
import DateUtils from '../utils/DateUtils';

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
        const today = new Date();
        const ceiCrawler = new CeiCrawler(user, password, {puppeteerLaunch: {headless: true}});

        let stocks = null;
        if (jobMetadata === null) {
            stocks = await ceiCrawler.getStockHistory();
        } else {
            const lastRun = jobMetadata.lastRun;
            if (!DateUtils.isSameDate(today, lastRun)) {
                stocks = await ceiCrawler.getStockHistory(lastRun, today);
            } else {
                return;
            }
        }
        await this._stockHistoryService.saveStockHistory(stocks);
        console.log('Job ran!');
    }

}

export default UpdateStockHistoryJob;
