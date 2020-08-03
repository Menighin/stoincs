import { ipcMain } from 'electron';
import WalletHistoryService from '../services/WalletHistoryService';

const METHODS = {
    GET_WALLET_PERFORMANCE: 'wallet-performance/get'
};

ipcMain.on(METHODS.GET_WALLET_PERFORMANCE, async (event, arg) => {
    const d1 = new Date(arg.d1);
    const d2 = new Date(arg.d2);
    const walletPerformance = await WalletHistoryService.getWalletPerformanceData(d1, d2);

    try {
        event.reply(METHODS.GET_WALLET_PERFORMANCE, { status: 'success', data: walletPerformance });
    } catch (e) {
        event.reply(METHODS.GET_WALLET_PERFORMANCE, { status: 'error', message: e.message });
    }
});

export default {};
