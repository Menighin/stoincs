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
        console.log(`Getting price for ${code}`);
        const res = await axios.get('https://www.alphavantage.co/query', {
            params: {
                function: ALPHA_VANTAGE_FUNCTIONS.GLOBAL_QUOTE,
                symbol: `${code}.SAO`,
                apikey: key
            }
        });

        console.log(`Response for ${code} is ${JSON.stringify(res.data)}`);
        let status = 'success';
        let errorMessage = '';
        if (!('Global Quote' in res.data)) {
            status = 'error';
            errorMessage = 'Error Message' in res.data ? 'Código inválido' : 'Número de chamadas da API excedido';
        }

        const globalQuote = res.data['Global Quote'];

        if (status === 'success') {
            return {
                status: status,
                errorMessage: errorMessage,
                code: code,
                price: parseFloat(globalQuote['05. price']),
                changePrice: parseFloat(globalQuote['09. change']),
                changePercent: parseFloat(globalQuote['10. change percent'].toString().slice(0, -1)),
                lastTradingDay: new Date(`${globalQuote['07. latest trading day']} 00:00:00`)
            };
        } else {
            return {
                code: code,
                status: status,
                errorMessage: errorMessage
            };
        }
    }

}

export default AlphaVantageService;
