import fs from 'fs';
import StockHistoryService from './StockHistoryService';
import FileSystemUtils from '../utils/FileSystemUtils';
// ZF71QL893E5Z2X0A
const FILES = {
    STOCKS_WALLET: 'wallet'
};


class WalletService {

    constructor() {
        this.stockHistoryService = new StockHistoryService();
    }

    async getWallet() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.STOCKS_WALLET}`;

        const wallet = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '[]');
        return wallet;
    }

    async refreshWalletFromHistory() {
        const stockHistory = await this.stockHistoryService.getStockHistory();
        let wallet = (await this.getWallet()).filter(o => o.source !== 'CEI');

        const dataByStock = {};
        for (const acc of stockHistory) {
            for (const stockOperation of acc.stockHistory) {
                
                // If it is a Fracionary stock, trimm the last 'F'
                let code = stockOperation.code;
                if (code.match(/\dF$/) != null)
                    code = code.slice(0, -1);

                if (!(code in dataByStock)) {
                    dataByStock[code] = {
                        code: code,
                        quantityBought: 0,
                        quantitySold: 0,
                        valueBought: 0,
                        valueSold: 0,
                        source: 'CEI'
                    };
                }

                if (stockOperation.operation === 'C') {
                    dataByStock[code].quantityBought += stockOperation.quantity;
                    dataByStock[code].valueBought += stockOperation.totalValue;
                } else {
                    dataByStock[code].quantitySold += stockOperation.quantity;
                    dataByStock[code].valueSold += stockOperation.totalValue;
                }
            }
        }

        wallet = [...wallet, ...Object.values(dataByStock)];

        await this.saveWallet(wallet, true);
    }

    async saveWallet(wallet, overwrite = false) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.STOCKS_WALLET}`;

        if (overwrite) {
            await fs.promises.writeFile(path, JSON.stringify(wallet));
        } else {
            const oldWallet = await this.getWallet();
            for (const w of wallet)
                oldWallet.push(w);
            await fs.promises.writeFile(path, JSON.stringify(oldWallet));
        }
    }
    
}

export default WalletService;