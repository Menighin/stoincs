import { BrowserWindow } from 'electron';
import axios from 'axios';

const ALPHA_VANTAGE_FUNCTIONS = {
    SYMBOL_SEARCH: 'SYMBOL_SEARCH',
    GLOBAL_QUOTE: 'GLOBAL_QUOTE'
};

class AlphaVantageService {

    constructor() {
        this.apiKey = null;
    }

    async getKey() {
        if (this.apiKey === null)
            this.apiKey = await BrowserWindow.getFocusedWindow().webContents.executeJavaScript('localStorage.getItem("configuration/alpha-vantage-key");', true);
        return this.apiKey;
    }

    async getLastValue(code) {
        const key = await this.getKey();

        const res = await axios.get('https://www.alphavantage.co/query', {
            params: {
                function: ALPHA_VANTAGE_FUNCTIONS.GLOBAL_QUOTE,
                symbol: `${code}.SAO`,
                apikey: key
            }
        });

        if (!('Global Quote' in res.data)) return null;

        const globalQuote = res.data['Global Quote'];

        return {
            code: code,
            price: parseFloat(globalQuote['05. price']),
            changePrice: parseFloat(globalQuote['09. change']),
            changePercent: parseFloat(globalQuote['10. change percent'].toString().slice(0, -1)),
            lastTradingDay: new Date(`${globalQuote['07. latest trading day']} 00:00:00`)
        };
    }

}

export default AlphaVantageService;