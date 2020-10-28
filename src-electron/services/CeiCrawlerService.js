import CeiCrawler from 'cei-crawler';
import ConfigurationService from '../services/ConfigurationService';
import AsyncUtils from '../utils/AsyncUtils';

class CeiCrawlerService {

    /** @type {CeiCrawler} */
    _ceiCrawler = null;

    /** @type {Boolean} */
    _isFree = true;

    _closeTimeout = null;

    /**
     * Returns a free instance of CeiCrawler
     * @returns {CeiCrawler} - Instance of CeiCrawler
     */
    async _getFreeInstance() {
        clearTimeout(this._closeTimeout);
        this._closeTimeout = null;
        if (this._ceiCrawler != null && this._isFree) {
            console.log(`[CEI CRAWLER SERVICE] Instance exists and it is free. Returning it...`);
            this._isFree = false;
            return this._ceiCrawler;
        }

        if (this._isFree === false) {
            console.log('[CEI CRAWLER SERVICE] Will wait until instance is free');
            await this._waitForFreeInstance();
            if (this._ceiCrawler != null) {
                this._isFree = false;
                return this._ceiCrawler;
            }
        }

        const configuration = await ConfigurationService.getConfiguration();
        const user = configuration.username || null;
        const password = configuration.password || null;

        if (user === null || password === null)
            throw new Error('Login no CEI não está configurado');

        this._isFree = false;

        this._ceiCrawler = new CeiCrawler(user, password, { capDates: true });

        return this._ceiCrawler;
    }

    async _waitForFreeInstance() {
        let duration = 20000; // Start with 20s
        while (!this._isFree) {
            console.log(`[CEI CRAWLER SERVICE] Waiting free instance for ${duration}ms...`);
            await AsyncUtils.timeout(duration);
            duration = Math.max(1000, parseInt(duration / 2)); // half down until 1s max
        }
        console.log(`[CEI CRAWLER SERVICE] Wait is over!`);
    }

    async freeUpInstance(instantly = false) {
        console.log('[CEI CRAWLER SERVICE] Freeing instance...');

        // If freed instance is not used for some time, closes it
        if (this._closeTimeout === null && !instantly)
            this._closeTimeout = setTimeout(async () => {
                console.log('[CEI CRAWLER SERVICE] Closing instance after some time idle...');
                this._ceiCrawler = null;
                this._closeTimeout = null;
            }, 60 * 1000);

        if (instantly) {
            this._closeTimeout = null;
            this._ceiCrawler = null;
        }

        this._isFree = true;
    }

    async getStockHistory(startDate, endDate) {
        const ceiCrawler = await this._getFreeInstance();
        console.log('[CEI CRAWLER SERVICE] Getting stock history...');
        try {
            console.log(startDate);
            console.log(endDate);
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
        console.log('[CEI CRAWLER SERVICE] Getting wallet...');
        try {
            const result = await ceiCrawler.getWallet(date);
            await this.freeUpInstance();
            return result;
        } catch (e) {
            await this.freeUpInstance();
            throw e;
        }
    }

    async getWalletOptions() {
        const ceiCrawler = await this._getFreeInstance();
        console.log('[CEI CRAWLER SERVICE] Getting wallet options...');
        try {
            const result = await ceiCrawler.getWalletOptions();
            await this.freeUpInstance();
            return result;
        } catch (e) {
            await this.freeUpInstance();
            throw e;
        }
    }

    async getDividends() {
        const ceiCrawler = await this._getFreeInstance();
        console.log('[CEI CRAWLER SERVICE] Getting dividends...');
        try {
            const result = await ceiCrawler.getDividends();
            await this.freeUpInstance();
            return result;
        } catch (e) {
            await this.freeUpInstance();
            throw e;
        }
    }

}

export default new CeiCrawlerService();
