import { ipcMain } from 'electron';
import StockPriceService from '../services/StockPriceService';

const METHODS = {
    GET_STOCK_PRICES: 'stock-prices/get'
};

ipcMain.on(METHODS.GET_STOCK_PRICES, async (event, arg) => {
    const stockPrices = await StockPriceService.getStockPrices();

    try {
        event.reply(METHODS.GET_STOCK_PRICES, { status: 'success', data: stockPrices });
    } catch (e) {
        event.reply(METHODS.GET_STOCK_PRICES, { status: 'error', message: e.message });
    }
});

export default {};
