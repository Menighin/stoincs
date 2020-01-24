import CeiCrawler from 'cei-crawler';
import { BrowserWindow } from 'electron';

class UpdateStockHistoryJob {

    /** @type {BrowserWindow} */
    static _browserWindow;

    /**
     * Setup the job to run from time to time
     * @param {BrowserWindow} browserWindow - Main browser window
     */
    static setup(browserWindow) {
        this._browserWindow = browserWindow;
        this.run();
        // setInterval(this.run, 1000 * 3);
    }

    static async run() {
        const user = await this._browserWindow.webContents.executeJavaScript('localStorage.getItem("configuration/username");', true);
        const password = await this._browserWindow.webContents.executeJavaScript('localStorage.getItem("configuration/password");', true);

        console.log('User: ' + user);

        const ceiCrawler = new CeiCrawler('01603772693', '#sddsC3i');
        const stocks = ceiCrawler.getStockHistory();
        stocks.then(d => console.log(d));
    }

}

export default UpdateStockHistoryJob;
