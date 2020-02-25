import { ipcMain } from 'electron';
import StockHistoryService from '../services/StockHistoryService';

const stockHistoryService = new StockHistoryService();

ipcMain.on('stockHistory/get', async (event, arg) => {
    const stockHistory = await stockHistoryService.getStockHistory();

    event.reply('stockHistory/get', stockHistory);
});

ipcMain.on('stockHistory/delete', async (event, id) => {
    try {
        stockHistoryService.deleteStockOperation(id);
        event.reply('stockHistory/delete', { status: 'success', id: id });
    } catch (e) {
        event.reply('stockHistory/delete', { status: 'error', error: e });
    }
});

ipcMain.on('stockHistory/create', async (event, stockOperation) => {
    try {
        stockOperation.date = new Date(stockOperation.date);
        const savedOperation = await stockHistoryService.createStockOperation(stockOperation);
        event.reply('stockHistory/create', { status: 'success', operation: savedOperation });
    } catch (e) {
        event.reply('stockHistory/create', { status: 'error', error: e });
    }
});

ipcMain.on('stockHistory/refresh', async (event, arg) => {
    try {
        await stockHistoryService.refreshHistory();
        event.reply('stockHistory/refresh', { status: 'success' });
    } catch (e) {
        event.reply('stockHistory/refresh', { status: 'error', error: e });
    }
});

export default {};
