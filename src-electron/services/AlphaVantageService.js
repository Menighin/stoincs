import { BrowserWindow } from 'electron';
import ConfigurationService from '../services/ConfigurationService';
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
            this.apiKey = (await ConfigurationService.getConfiguration()).alphaVantageKey || '';
        return this.apiKey;
    }

    async getLastValue(code) {
        const key = await this.getKey();

        if (!key)
            return {
                status: 'error',
                code: code,
                errorMessage: 'A chave da Alpha Vantage não está configurada'
            };

        const res = await axios.get('https://www.alphavantage.co/query', {
            params: {
                function: ALPHA_VANTAGE_FUNCTIONS.GLOBAL_QUOTE,
                symbol: `${code}.SA`,
                apikey: key
            }
        });

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

export default new AlphaVantageService();
