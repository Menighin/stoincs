import { ipcMain } from 'electron';
import ConfigurationService from '../services/ConfigurationService';

const METHODS = {
    GET_CONFIGURATION: 'configuration/get',
    UPDATE_CONFIGURATION: 'configuration/update',
    GET_STOCK_OPTIONS: 'configuration/get-stock-options',
    UPDATE_AUTO_UPDATE_PRICE: 'configuration/auto-update-price'
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

ipcMain.on(METHODS.UPDATE_AUTO_UPDATE_PRICE, async (event, arg) => {
    try {
        await ConfigurationService.updateAutoUpdatePrice(arg.autoUpdate);
        event.reply(METHODS.UPDATE_AUTO_UPDATE_PRICE, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.UPDATE_AUTO_UPDATE_PRICE, { status: 'error', message: e.message });
    }
});

export default {};
