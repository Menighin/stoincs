import fs from 'fs';
import StockHistoryService from './StockHistoryService';
import FileSystemUtils from '../utils/FileSystemUtils';
import StockUtils from '../utils/StockUtils';

const FILES = {
    STOCKS_WALLET: 'wallet'
};

class WalletService {

    async getWallet() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.STOCKS_WALLET}`;

        const wallet = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '[]');
        return wallet.sort((a, b) => a.code < b.code ? -1 : a.code > b.code ? 1 : 0);
    }

    async refreshWalletFromHistory() {
        const stockHistory = await StockHistoryService.getStockHistory();
        let walletByCode = (await this.getWallet()).reduce((p, c) => {
            p[c.code] = c;
            return p;
        }, {});

        const dataByStock = {};
        for (const acc of stockHistory) {
            for (const stockOperation of acc.stockHistory) {
                const code = StockUtils.getStockCode(stockOperation.code);

                if (!(code in dataByStock)) {
                    dataByStock[code] = {
                        code: code,
                        quantity: 0,
                        label: ''
                    };
                }

                if (stockOperation.operation === 'C')
                    dataByStock[code].quantity += stockOperation.quantity;
                else
                    dataByStock[code].quantity -= stockOperation.quantity;
            }
        }

        const wallet = Object.values(dataByStock).filter(o => o.quantity > 0);

        // Keep price info and label
        for (const w of wallet) {
            if (w.code in walletByCode) {
                const oldItem = walletByCode[w.code];
                w.label = oldItem.label;
            }
        }

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

    async updateLabel(stock, label) {
        const wallet = await this.getWallet();

        wallet.filter(o => o.code === stock)[0].label = label;

        await this.saveWallet(wallet, true);
    }

}

export default new WalletService();
export { FILES as WalletFiles };
