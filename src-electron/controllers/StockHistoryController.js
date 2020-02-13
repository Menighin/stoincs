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

export default {};
