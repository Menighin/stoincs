import { ipcMain } from 'electron';
import WalletService from '../services/WalletService';

const walletService = new WalletService();

const METHODS = {
    GET_WALLET: 'wallet/get',
    REFRESH_FROM_HISTORY: 'wallet/refresh-from-history',
    UPDATE_LAST_VALUE: 'wallet/update-last-value',
    UPDATE_LABEL: 'wallet/update-label'
};

ipcMain.on(METHODS.GET_WALLET, async (event, arg) => {
    const wallet = await walletService.getWallet();

    try {
        event.reply(METHODS.GET_WALLET, { status: 'success', data: wallet });
    } catch (e) {
        event.reply(METHODS.GET_WALLET, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.REFRESH_FROM_HISTORY, async (event, arg) => {
    try {
        await walletService.refreshWalletFromHistory();
        event.reply(METHODS.REFRESH_FROM_HISTORY, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.REFRESH_FROM_HISTORY, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.UPDATE_LAST_VALUE, async (event, arg) => {
    try {
        const lastValues = await walletService.updateLastValues(arg.stocks);
        event.reply(METHODS.UPDATE_LAST_VALUE, { status: 'success', data: { stocks: lastValues, type: arg.type } });
    } catch (e) {
        event.reply(METHODS.UPDATE_LAST_VALUE, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.UPDATE_LABEL, async (event, arg) => {
    try {
        await walletService.updateLabel(arg.stock, arg.label);
        event.reply(METHODS.UPDATE_LABEL, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.UPDATE_LABEL, { status: 'error', message: e.message });
    }
});

export default {};
