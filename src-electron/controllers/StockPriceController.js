import { ipcMain } from 'electron';
import StockPriceService from '../services/StockPriceService';
import UpdatePricesJob from '../jobs/UpdatePricesJob';

const METHODS = {
    GET_STOCK_PRICES: 'stock-prices/get',
    AUTO_UPDATE: 'stock-prices/auto-update',
    DELETE_STOCK: 'stock-prices/delete-stock',
    ADD_STOCK: 'stock-prices/add-stock',
    SAVE_STOCKS_CONFIGURATION: 'stock-prices/save-stocks-configuration',
    UPDATE_STOCK_PRICE: 'stock-prices/update-stock-price'
};

ipcMain.on(METHODS.GET_STOCK_PRICES, async (event, arg) => {
    const stockPrices = await StockPriceService.getStockPrices();

    try {
        event.reply(METHODS.GET_STOCK_PRICES, { status: 'success', data: stockPrices });
    } catch (e) {
        event.reply(METHODS.GET_STOCK_PRICES, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.AUTO_UPDATE, async (event, arg) => {
    try {
        const lastValues = await StockPriceService.autoUpdateStockPrices(arg.stocks);
        event.reply(METHODS.AUTO_UPDATE, { status: 'success', data: lastValues });
    } catch (e) {
        event.reply(METHODS.AUTO_UPDATE, { status: 'error', message: e.message });
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
        const stockPrice = await StockPriceService.addStockPrice(arg);
        await UpdatePricesJob.updateConfig();
        event.reply(METHODS.ADD_STOCK, { status: 'success', data: stockPrice });
    } catch (e) {
        event.reply(METHODS.ADD_STOCK, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.SAVE_STOCKS_CONFIGURATION, async (event, arg) => {
    try {
        await StockPriceService.saveStockPricesConfiguration(arg);
        event.reply(METHODS.SAVE_STOCKS_CONFIGURATION, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.SAVE_STOCKS_CONFIGURATION, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.UPDATE_STOCK_PRICE, async (event, arg) => {
    try {
        await StockPriceService.updateStockPrice(arg.code, arg.stockPrice);
        event.reply(METHODS.UPDATE_STOCK_PRICE, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.UPDATE_STOCK_PRICE, { status: 'error', message: e.message });
    }
});

export default {};
