import CeiCrawler from 'cei-crawler';
import ConfigurationService from '../services/ConfigurationService';
import puppeteer from 'puppeteer';
import AsyncUtils from '../utils/AsyncUtils';

class CeiCrawlerService {

    /** @type {CeiCrawler} */
    _ceiCrawler = null;

    /** @type {Boolean} */
    _isFree = true;

    _closeTimeout = null;

    async _getFreeInstance() {
        clearTimeout(this._closeTimeout);
        if (this._ceiCrawler != null && this._isFree) {
            console.log(`[CEI CRAWLER SERVICE] Instance exists and it is free. Returning it...`);
            this._isFree = false;
            return this._ceiCrawler;
        }

        if (this._isFree === false) {
            console.log('[CEI CRAWLER SERVICE] Will wait until instance is free');
            await this._waitForFreeInstance();
            this._isFree = false;
            return this._ceiCrawler;
        }

        this._isFree = false;
        const configuration = await ConfigurationService.getConfiguration();
        const user = configuration.username || '';
        const password = configuration.password || '';

        const chromiumPath = puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked/node_modules/puppeteer');
        this._ceiCrawler = new CeiCrawler(user, password, { puppeteerLaunch: { headless: true, executablePath: chromiumPath }, capDates: true });

        return this._ceiCrawler;
    }

    async _waitForFreeInstance() {
        let duration = 20000; // Start with 10s
        while (!this._isFree) {
            console.log(`[CEI CRAWLER SERVICE] Waiting free instance for ${duration}ms...`);
            await AsyncUtils.timeout(duration);
            duration = Math.max(1000, parseInt(duration / 2)); // half down until 1s max
        }
        console.log(`[CEI CRAWLER SERVICE] Wait is over!`);
    }

    async freeUpInstance(instantly = false) {
        console.log('[CEI CRAWLER SERVICE] Freeing instance...');
        this._isFree = true;

        // If freed instance is not used for some time, closes it
        if (this._closeTimeout === null && !instantly)
            this._closeTimeout = setTimeout(async () => {
                console.log('[CEI CRAWLER SERVICE] Closing instance after some time idle...');
                if (this._ceiCrawler != null)
                    await this._ceiCrawler.close();
                this._ceiCrawler = null;
                this._closeTimeout = null;
            }, 60 * 1000);

        if (instantly) {
            this._closeTimeout = null;
            this._ceiCrawler = null;
        }
    }

    async getStockHistory(startDate, endDate) {
        const ceiCrawler = await this._getFreeInstance();
        try {
            const result = await ceiCrawler.getStockHistory(startDate, endDate);
            await this.freeUpInstance();
            return result;
        } catch (e) {
            await this.freeUpInstance();
            throw e;
        }
    }

    async getWallet(date) {
        const ceiCrawler = await this._getFreeInstance();
        try {
            const result = await ceiCrawler.getWallet(date);
            await this.freeUpInstance();
            return result;
        } catch (e) {
            await this.freeUpInstance();
            throw e;
        }
    }

}

export default new CeiCrawlerService();
