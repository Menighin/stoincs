import { ipcMain } from 'electron';
import StockHistoryService from '../services/StockHistoryService';

const METHODS = {
    GET: 'stockHistory/get',
    DELETE: 'stockHistory/delete',
    CREATE: 'stockHistory/create',
    UPDATE: 'stockHistory/update',
    REFRESH: 'stockHistory/refresh',
    SPLIT: 'stockHistory/split',
    CONSOLIDATED: 'stockHistory/consolidated',
    AVERAGE_PRICES: 'stockHistory/average-prices',
    PROFIT_LOSS: 'stockHistory/profit-loss',
    KPIS: 'stockHistory/kpis'
};

ipcMain.on(METHODS.GET, async (event, arg) => {
    const stockHistory = await StockHistoryService.getStockHistory();

    event.reply(METHODS.GET, stockHistory);
});

ipcMain.on(METHODS.DELETE, async (event, id) => {
    try {
        StockHistoryService.deleteStockOperation(id);
        event.reply(METHODS.DELETE, { status: 'success', id: id });
    } catch (e) {
        event.reply(METHODS.DELETE, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.CREATE, async (event, stockOperation) => {
    try {
        stockOperation.date = new Date(stockOperation.date);
        const savedOperation = await StockHistoryService.createStockOperation(stockOperation);
        event.reply(METHODS.CREATE, { status: 'success', operation: savedOperation });
    } catch (e) {
        event.reply(METHODS.CREATE, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.UPDATE, async (event, stockOperation) => {
    try {
        stockOperation.date = new Date(stockOperation.date);
        const updatedOperation = await StockHistoryService.updateStockOperation(stockOperation);
        event.reply(METHODS.UPDATE, { status: 'success', operation: updatedOperation });
    } catch (e) {
        event.reply(METHODS.UPDATE, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.REFRESH, async (event, arg) => {
    try {
        await StockHistoryService.refreshHistory();
        event.reply(METHODS.REFRESH, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.REFRESH, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.SPLIT, async (event, arg) => {
    try {
        const splitted = await StockHistoryService.splitOperations(arg);
        event.reply(METHODS.SPLIT, { status: 'success', count: splitted });
    } catch (e) {
        event.reply(METHODS.SPLIT, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.CONSOLIDATED, async (event, arg) => {
    try {
        const startDate = arg && arg.startDate ? new Date(arg.startDate) : null;
        const endDate = arg && arg.endDate ? new Date(arg.endDate) : null;
        const consolidated = await StockHistoryService.getConsolidatedStockHistory(startDate, endDate);
        event.reply(METHODS.CONSOLIDATED, { status: 'success', data: consolidated });
    } catch (e) {
        event.reply(METHODS.CONSOLIDATED, { status: 'error', error: e, message: e.message });
        throw e;
    }
});

ipcMain.on(METHODS.AVERAGE_PRICES, async (event, arg) => {
    try {
        const endDate = arg && arg.endDate ? new Date(arg.endDate) : null;
        const averagePrices = await StockHistoryService.getAveragePrices(endDate);
        event.reply(METHODS.AVERAGE_PRICES, { status: 'success', data: averagePrices });
    } catch (e) {
        event.reply(METHODS.AVERAGE_PRICES, { status: 'error', error: e, message: e.message });
        throw e;
    }
});

ipcMain.on(METHODS.PROFIT_LOSS, async (event, arg) => {
    try {
        const startDate = arg && arg.startDate ? new Date(arg.startDate) : null;
        const endDate = arg && arg.endDate ? new Date(arg.endDate) : null;
        const profitLoss = await StockHistoryService.getProfitLoss(startDate, endDate);
        event.reply(METHODS.PROFIT_LOSS, { status: 'success', data: profitLoss });
    } catch (e) {
        event.reply(METHODS.PROFIT_LOSS, { status: 'error', error: e, message: e.message });
        throw e;
    }
});

ipcMain.on(METHODS.KPIS, async (event, arg) => {
    try {
        const startDate = arg && arg.startDate ? new Date(arg.startDate) : null;
        const endDate = arg && arg.endDate ? new Date(arg.endDate) : null;
        const kpis = await StockHistoryService.getKpis(startDate, endDate);
        event.reply(METHODS.KPIS, { status: 'success', data: kpis });
    } catch (e) {
        event.reply(METHODS.KPIS, { status: 'error', error: e, message: e.message });
        throw e;
    }
});

export default {};
