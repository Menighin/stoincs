import CeiCrawler from 'cei-crawler';
import { BrowserWindow } from 'electron';
import StockHistoryService from '../services/StockHistoryService';

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

        console.log('User: ' + user);

        const ceiCrawler = new CeiCrawler(user, password);
        const stocks = ceiCrawler.getStockHistory();
        await this._stockHistoryService.getPath();
        stocks.then(d => console.log(d));
    }

}

export default UpdateStockHistoryJob;
