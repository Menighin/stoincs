import { ipcMain } from 'electron';
import UpdatePricesJob from '../jobs/UpdatePricesJob';
import UpdateStockHistoryJob from '../jobs/UpdateStockHistoryJob';
import ConfigurationService from '../services/ConfigurationService';

const METHODS = {
    GET_CONFIGURATION: 'configuration/get',
    UPDATE_CONFIGURATION: 'configuration/update'
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

export default {};
