import { ipcMain } from 'electron';
import StockHistoryService from '../services/StockHistoryService';

ipcMain.on('stockHistory/get', async (event, arg) => {
    const stockHistoryService = new StockHistoryService();
    const stockHistory = await stockHistoryService.getStockHistory();

    event.reply('stockHistory/get', stockHistory);
});

export default {};
