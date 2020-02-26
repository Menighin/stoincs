import { ipcMain } from 'electron';
import WalletService from '../services/WalletService';

const walletService = new WalletService();

const METHODS = {
    GET_WALLET: 'wallet/get',
    REFRESH_FROM_HISTORY: 'wallet/refresh-from-history'
};

ipcMain.on(METHODS.GET_WALLET, async (event, arg) => {
    const wallet = await walletService.getWallet();

    try {
        event.reply(METHODS.GET_WALLET, { status: 'success', data: wallet });
    } catch (e) {
        event.reply(METHODS.GET_WALLET, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.REFRESH_FROM_HISTORY, async (event, arg) => {
    try {
        await walletService.refreshWalletFromHistory();
        event.reply(METHODS.REFRESH_FROM_HISTORY, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.REFRESH_FROM_HISTORY, { status: 'error', error: e });
    }
});

export default {};
