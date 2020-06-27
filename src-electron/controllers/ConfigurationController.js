import { ipcMain } from 'electron';
import UpdatePricesJob from '../jobs/UpdatePricesJob';
import UpdateStockHistoryJob from '../jobs/UpdateStockHistoryJob';
import ConfigurationService from '../services/ConfigurationService';
import StockPriceService from '../services/StockPriceService';

const METHODS = {
    GET_CONFIGURATION: 'configuration/get',
    UPDATE_CONFIGURATION: 'configuration/update',
    GET_STOCK_OPTIONS: 'configuration/get-stock-options',
    DELETE_STOCK: 'configuration/delete-stock',
    ADD_STOCK: 'configuration/add-stock'
};

ipcMain.on(METHODS.GET_CONFIGURATION, async (event, arg) => {
    const configurations = await ConfigurationService.getConfiguration();

    try {
        event.reply(METHODS.GET_CONFIGURATION, { status: 'success', data: configurations });
    } catch (e) {
        event.reply(METHODS.GET_CONFIGURATION, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.UPDATE_CONFIGURATION, async (event, arg) => {
    try {
        await ConfigurationService.saveConfiguration(arg);
        await UpdatePricesJob.updateConfig();
        UpdateStockHistoryJob.run();
        event.reply(METHODS.UPDATE_CONFIGURATION, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.UPDATE_CONFIGURATION, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.GET_STOCK_OPTIONS, async (event, arg) => {
    try {
        const data = await ConfigurationService.getStockOptions();
        event.reply(METHODS.GET_STOCK_OPTIONS, { status: 'success', data: data });
    } catch (e) {
        event.reply(METHODS.GET_STOCK_OPTIONS, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.DELETE_STOCK, async (event, arg) => {
    try {
        await Promise.all([ConfigurationService.deleteStock(arg.code), StockPriceService.deleteStockPrice(arg.code)]);
        event.reply(METHODS.DELETE_STOCK, { status: 'success', code: arg.code });
    } catch (e) {
        event.reply(METHODS.DELETE_STOCK, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.ADD_STOCK, async (event, arg) => {
    try {
        await ConfigurationService.addStock(arg.code);
        const stockPrice = await StockPriceService.addStockPrice(arg.code);
        event.reply(METHODS.ADD_STOCK, { status: 'success', data: stockPrice });
    } catch (e) {
        event.reply(METHODS.ADD_STOCK, { status: 'error', message: e.message });
    }
});

export default {};
