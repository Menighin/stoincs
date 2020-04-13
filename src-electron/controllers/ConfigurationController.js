import { ipcMain } from 'electron';
import UpdatePricesJob from '../jobs/UpdatePricesJob';

const METHODS = {
    UPDATE_CONFIGURATION: 'configuration/update'
};

ipcMain.on(METHODS.UPDATE_CONFIGURATION, async (event, arg) => {
    try {
        UpdatePricesJob.updateConfig();
        event.reply(METHODS.UPDATE_CONFIGURATION, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.UPDATE_CONFIGURATION, { status: 'error', message: e.message });
    }
});

export default {};
