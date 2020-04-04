import CeiCrawler from 'cei-crawler';
import { BrowserWindow } from 'electron';
import StockHistoryService from '../services/StockHistoryService';
import DateUtils from '../utils/DateUtils';
import StockUtils from '../utils/StockUtils';
import NotificationService from '../services/NotificationService';

const NOTIFICATION = {
    TITLE: 'Negociações',
    ICON: 'eva-book-open-outline'
};

class UpdateStockHistoryJob {

    /** @type {BrowserWindow} */
    _browserWindow;

    /** @type {StockHistoryService} */
    _stockHistoryService;

    /** @type {NotificationService} */
    _notificationService;

    /**
     * Setup the job to run from time to time
     * @param {StockHistoryService} stockHistoryService - Service to handle the stock history
     * @param {BrowserWindow} browserWindow - Main browser window
     */
    setup(stockHistoryService, browserWindow) {
        this._stockHistoryService = stockHistoryService;
        this._browserWindow = browserWindow;
        this._notificationService = new NotificationService();
        setTimeout(() => this.run(), 30000);
        // setInterval(this.run, 1000 * 3);
    }

    async run() {
        console.log('Running stock history job...');
        const evtCode = 'STOCK_HISTORY_JOB';
        this._notificationService.notifyLoadingStart({ code: evtCode, message: 'Crawling negociações do CEI' });

        try {
            const user = await this._browserWindow.webContents.executeJavaScript('localStorage.getItem("configuration/username");', true);
            const password = await this._browserWindow.webContents.executeJavaScript('localStorage.getItem("configuration/password");', true);

            const jobMetadata = await this._stockHistoryService.getStockHistoryJobMetadata();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const ceiCrawler = new CeiCrawler(user, password, { puppeteerLaunch: { headless: true }, capStartDate: true, capEndDate: true });

            console.log('Executing CEI Crawler...');
            let stocksByAccount = null;
            if (jobMetadata === null) {
                stocksByAccount = await ceiCrawler.getStockHistory();
            } else {
                const lastRun = jobMetadata.lastRun;
                if (!DateUtils.isSameDate(yesterday, lastRun)) {
                    stocksByAccount = await ceiCrawler.getStockHistory(lastRun, yesterday);
                } else {
                    this._notificationService.notifyMessage(NOTIFICATION.TITLE, `Negociações já estão atualizadas com o CEI`, NOTIFICATION.ICON);
                    return;
                }
            }

            console.log('Processing stock history from CEI');
            let newNegotiations = 0;

            // Setting CEI as source and ID for stock Histories
            stocksByAccount.forEach(i => {
                i.stockHistory.forEach(s => {
                    s.source = 'CEI';
                    s.id = StockUtils.generateId(s, i.account);
                    newNegotiations++;
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

            this._notificationService.notifyMessage(NOTIFICATION.TITLE, `${newNegotiations} novas negociações adicionadas`, NOTIFICATION.ICON);
        } catch (e) {
            console.log('Erro StockHistory crawler');
            console.log(e);
            this._notificationService.notifyMessage(NOTIFICATION.TITLE, `Erro ao buscar no CEI: ${e.message}`, NOTIFICATION.ICON);
        }
        this._notificationService.notifyLoadingFinish(evtCode);
    }

}

export default UpdateStockHistoryJob;
