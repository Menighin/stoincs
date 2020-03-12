import { ipcMain } from 'electron';
import StockHistoryService from '../services/StockHistoryService';

const stockHistoryService = new StockHistoryService();

const METHODS = {
    GET: 'stockHistory/get',
    DELETE: 'stockHistory/delete',
    CREATE: 'stockHistory/create',
    UPDATE: 'stockHistory/update',
    REFRESH: 'stockHistory/refresh',
    SPLIT: 'stockHistory/split'
};

ipcMain.on(METHODS.GET, async (event, arg) => {
    const stockHistory = await stockHistoryService.getStockHistory();

    event.reply(METHODS.GET, stockHistory);
});

ipcMain.on(METHODS.DELETE, async (event, id) => {
    try {
        stockHistoryService.deleteStockOperation(id);
        event.reply(METHODS.DELETE, { status: 'success', id: id });
    } catch (e) {
        event.reply(METHODS.DELETE, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.CREATE, async (event, stockOperation) => {
    try {
        stockOperation.date = new Date(stockOperation.date);
        const savedOperation = await stockHistoryService.createStockOperation(stockOperation);
        event.reply(METHODS.CREATE, { status: 'success', operation: savedOperation });
    } catch (e) {
        event.reply(METHODS.CREATE, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.UPDATE, async (event, stockOperation) => {
    try {
        stockOperation.date = new Date(stockOperation.date);
        const updatedOperation = await stockHistoryService.updateStockOperation(stockOperation);
        event.reply(METHODS.UPDATE, { status: 'success', operation: updatedOperation });
    } catch (e) {
        event.reply(METHODS.UPDATE, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.REFRESH, async (event, arg) => {
    try {
        await stockHistoryService.refreshHistory();
        event.reply(METHODS.REFRESH, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.REFRESH, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.SPLIT, async (event, arg) => {
    try {
        const splitted = await stockHistoryService.splitOperations(arg);
        event.reply(METHODS.SPLIT, { status: 'success', count: splitted });
    } catch (e) {
        event.reply(METHODS.SPLIT, { status: 'error', error: e });
    }
});

export default {};
