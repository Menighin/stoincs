import { ipcMain } from 'electron';
import StockPriceService from '../services/StockPriceService';
import UpdatePricesJob from '../jobs/UpdatePricesJob';

const METHODS = {
    GET_STOCK_PRICES: 'stock-prices/get',
    UPDATE: 'stock-prices/update',
    DELETE_STOCK: 'stock-prices/delete-stock',
    ADD_STOCK: 'stock-prices/add-stock',
    SAVE_STOCKS: 'stock-prices/save-stocks'
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

ipcMain.on(METHODS.DELETE_STOCK, async (event, arg) => {
    try {
        await StockPriceService.deleteStockPrice(arg.code);
        event.reply(METHODS.DELETE_STOCK, { status: 'success', code: arg.code });
    } catch (e) {
        event.reply(METHODS.DELETE_STOCK, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.ADD_STOCK, async (event, arg) => {
    try {
        const stockPrice = await StockPriceService.addStockPrice(arg.code);
        await UpdatePricesJob.updateConfig();
        event.reply(METHODS.ADD_STOCK, { status: 'success', data: stockPrice });
    } catch (e) {
        event.reply(METHODS.ADD_STOCK, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.SAVE_STOCKS, async (event, arg) => {
    try {
        await StockPriceService.saveStockPricesConfiguration(arg);
        event.reply(METHODS.SAVE_STOCKS, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.SAVE_STOCKS, { status: 'error', message: e.message });
    }
});

export default {};
