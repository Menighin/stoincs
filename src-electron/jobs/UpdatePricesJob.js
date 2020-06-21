import { BrowserWindow } from 'electron';
import StockPriceService from '../services/StockPriceService';
import ConfigurationService from '../services/ConfigurationService';
import NotificationService from '../services/NotificationService';

class UpdatePricesJob {

    /** @type {BrowserWindow} */
    _browserWindow;

    /** @type {which: String, when: Number, many: Number} */
    _configuration;

    _interval;

    _updateSlice = [];

    /**
     * Setup the job
     * @param {BrowserWindow} browserWindow Browser window to be notified
     */
    async setup(browserWindow) {
        this._browserWindow = browserWindow;

        this._configuration = (await ConfigurationService.getConfiguration()).priceUpdate || {};

        if (this._configuration && this._configuration.when > 0) {
            setTimeout(() => {
                this.run();
                this._interval = setInterval(() => { this.run() }, this._configuration.when * 1000 * 60);
            }, 2000);
        }
    }

    async run() {
        if (this._configuration.which === 'none' || !this.inWorkingHours()) {
            console.log('Prices wont be updated');
            return;
        }

        const stocksToUpdate = this._configuration.stocks || [];

        const totalToUpdate = stocksToUpdate.length;

        if (stocksToUpdate.length === 0) return;

        if (this._updateSlice.length === 0 || this._updateSlice[1] >= totalToUpdate) {
            this._updateSlice = [0, this._configuration.many];
        } else {
            this._updateSlice[0] = this._updateSlice[1];
            this._updateSlice[1] = Math.min(this._updateSlice[1] + this._configuration.many, totalToUpdate);
        }

        const stocks = stocksToUpdate.slice(this._updateSlice[0], this._updateSlice[1]);

        this._browserWindow.webContents.send('stock-prices/updating', { data: stocks });
        NotificationService.notifyLoadingStart('updating-prince', 'Atualizando preços');
        const result = await StockPriceService.updateStockPrices(stocks);
        this._browserWindow.webContents.send('stock-prices/update', { data: result });

        NotificationService.notifyMessage('Preços atualizados', stocks.join(', '), 'eva-bar-chart');
        NotificationService.notifyLoadingFinish('updating-prince');
    }

    async updateConfig() {
        clearInterval(this._interval);
        this._configuration = (await ConfigurationService.getConfiguration()).priceUpdate || {};

        console.log(`Updating prices job to run every ${this._configuration.when} minute(s)`);
        this._interval = setInterval(() => { this.run() }, this._configuration.when * 1000 * 60);
    }

    inWorkingHours() {
        const now = new Date();

        const [h1, m1] = this._configuration.startTime.split(':').map(o => parseInt(o));
        const [h2, m2] = this._configuration.endTime.split(':').map(o => parseInt(o));

        const d1 = new Date();
        d1.setHours(h1);
        d1.setMinutes(m1);

        const d2 = new Date();
        if (h2 < h1 || (h2 === h1 && m2 < m1))
            d2.setTime(d2.getTime() + 1000 * 60 * 60 * 24);
        d2.setHours(h2);
        d2.setMinutes(m2);

        return now.getTime() >= d1.getTime() && now.getTime() <= d2.getTime();
    }

}

export default new UpdatePricesJob();
