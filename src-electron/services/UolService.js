import axios from 'axios';

class UolService {

    constructor() {
        this._cacheCodeId = {};
    }
    
    async getLastValue(code) {

        try {
            const id = await this._getIdByCode(code);
            
            const responsePrice = await axios.get(`https://api.cotacoes.uol.com/asset/intraday/list/?format=JSON&fields=price,change,pctChange,date&item=${id}`);
            const priceData = responsePrice.data.docs[0];

            return {
                status: 'success',
                code: code,
                price: priceData.price,
                changePrice: priceData.change,
                changePercent: priceData.pctChange,
                apiUpdate: this._getDateFromStr(priceData.date)
            };
        
        } catch (e) {
            return {
                status: 'error',
                code: code,
                errorMessage: `Preço não encontrado`
            };
        }
    }
    
    async _getIdByCode(code) {
        if (this._cacheCodeId[code])
            return this._cacheCodeId[code];
        
        const response = await axios.get(`https://economia.uol.com.br/cotacoes/bolsas/acoes/bvsp-bovespa/${code.toLowerCase()}-sa/`);
        
        const html = response.data;
        const re = /(data-id="\d*")/g;
        const dataIdAttr = html.match(re)[0];
        const id = parseInt(dataIdAttr.replace(/\D/g,''));
        
        this._cacheCodeId[code] = id;
        
        return id;
    }

    _getDateFromStr(dateStr) {
        const year = dateStr.substr(0, 4);
        const month = parseInt(dateStr.substr(4, 2));
        const day = dateStr.substr(6, 2);
        const hour = dateStr.substr(8, 2);
        const minute = dateStr.substr(10, 2);
        const seconds = dateStr.substr(12, 2);
        return new Date(year, month - 1, day, hour, minute, seconds);
    }

}

export default new UolService();
