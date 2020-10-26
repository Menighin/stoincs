import ConfigurationService from '../services/ConfigurationService';
import axios from 'axios';

class HgBrasilService {

    async getKey() {
        return (await ConfigurationService.getConfiguration()).hgBrasilKey || '';
    }

    async getLastValue(code) {
        const key = await this.getKey();

        if (!key)
            return {
                status: 'error',
                code: code,
                errorMessage: 'A chave da HG Brasil não está configurada'
            };

        const response = await axios.get('https://api.hgbrasil.com/finance/stock_price', {
            params: {
                symbol: code,
                key: key,
                format: 'json-cors'
            }
        });

        const res = response.data;

        if (!res.valid_key) {
            return {
                status: 'error',
                code: code,
                errorMessage: 'A chave da API HG Brasil é inválida'
            };
        }

        const data = res.results[code];

        if (data.error)
            return {
                status: 'error',
                code: code,
                errorMessage: data.message
            };

        return {
            status: 'success',
            code: code,
            price: data.price,
            changePrice: Math.round((data.price * (data.change_percent / 100)) * 100) / 100,
            changePercent: data.change_percent,
            apiUpdate: new Date(data.updated_at)
        };
    }

}

export default new HgBrasilService();
