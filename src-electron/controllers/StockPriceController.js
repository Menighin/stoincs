import { ipcMain } from 'electron';
import StockPriceService from '../services/StockPriceService';

const METHODS = {
    GET_STOCK_PRICES: 'stock-prices/get',
    UPDATE: 'stock-prices/update'
};

ipcMain.on(METHODS.GET_STOCK_PRICES, async (event, arg) => {
    const stockPrices = await StockPriceService.getStockPrices();

    try {
        event.reply(METHODS.GET_STOCK_PRICES, { status: 'success', data: stockPrices });
    } catch (e) {
        event.reply(METHODS.GET_STOCK_PRICES, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.UPDATE, async (event, arg) => {
    try {
        const lastValues = await StockPriceService.updateStockPrices(arg.stocks);
        event.reply(METHODS.UPDATE, { status: 'success', data: lastValues });
    } catch (e) {
        event.reply(METHODS.UPDATE, { status: 'error', message: e.message });
    }
});

export default {};
