import StockHistoryService from '../services/StockHistoryService';
import DateUtils from '../utils/DateUtils';
import StockUtils from '../utils/StockUtils';
import NotificationService from '../services/NotificationService';
import WalletService from '../services/WalletService';
import CeiCrawlerService from '../services/CeiCrawlerService';

const NOTIFICATION = {
    TITLE: 'Negociações',
    ICON: 'fas fa-receipt'
};

class UpdateStockHistoryJob {

    setup() {
        setTimeout(() => this.run(), 15000);
        setInterval(() => this.run(), 1000 * 60 * 60 * 12);
    }

    async run() {
        console.log('Running stock history job...');
        const evtCode = 'STOCK_HISTORY_JOB';
        NotificationService.notifyLoadingStart(evtCode, 'Crawling negociações do CEI');

        try {
            const jobMetadata = await StockHistoryService.getStockHistoryJobMetadata();
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            console.log('Getting stock history...');
            let stocksByAccount = null;
            if (!jobMetadata || !jobMetadata.lastRun) {
                stocksByAccount = await CeiCrawlerService.getStockHistory();
            } else {
                const lastRun = jobMetadata.lastRun;
                if (!DateUtils.isSameDate(today, lastRun)) {
                    const lastStockHistoryDate = (await StockHistoryService.getStockHistoryOperations())
                        .reduce((p, c) => {
                            return p > c.date ? p : c.date;
                        }, new Date(2000, 1, 1));
                    lastStockHistoryDate.setDate(lastStockHistoryDate.getDate() + 1);
                    stocksByAccount = await CeiCrawlerService.getStockHistory(lastStockHistoryDate, yesterday);
                } else {
                    NotificationService.notifyMessage(NOTIFICATION.TITLE, `Negociações já estão atualizadas com o CEI`, NOTIFICATION.ICON);
                    NotificationService.notifyLoadingFinish(evtCode);
                    return;
                }
            }

            console.log('Processing stock history from CEI');
            let newNegotiations = 0;

            // Setting CEI as source and ID for stock Histories
            stocksByAccount.forEach(i => {
                i.stockHistory.forEach(s => {
                    s.source = 'CEI';
                    s.id = StockUtils.generateId(s, i.account);
                    newNegotiations++;
                });
            });

            // Merging duplicates
            stocksByAccount.forEach(acc => {
                const stockOperationById = {};
                acc.stockHistory.forEach(s => {
                    if (s.id in stockOperationById) {
                        stockOperationById[s.id].totalValue += s.totalValue;
                        stockOperationById[s.id].quantity += s.quantity;
                    } else {
                        stockOperationById[s.id] = s;
                    }
                });
                acc.stockHistory = Object.values(stockOperationById);
            });

            await StockHistoryService.saveStockHistory(stocksByAccount);
            await StockHistoryService.updateStockHistoryJobMetadata();

            // Update wallet
            await WalletService.refreshWalletFromHistory();

            NotificationService.notifyMessage(NOTIFICATION.TITLE, `${newNegotiations} novas negociações adicionadas`, NOTIFICATION.ICON);
        } catch (e) {
            console.log('Erro StockHistory crawler');
            console.log(e);
            NotificationService.notifyMessage(NOTIFICATION.TITLE, `Erro ao buscar no CEI: ${e.message}`, NOTIFICATION.ICON);
        }
        NotificationService.notifyLoadingFinish(evtCode);
    }

}

export default new UpdateStockHistoryJob();
