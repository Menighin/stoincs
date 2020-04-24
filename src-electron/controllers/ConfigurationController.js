import { ipcMain } from 'electron';
import UpdatePricesJob from '../jobs/UpdatePricesJob';
import UpdateStockHistoryJob from '../jobs/UpdateStockHistoryJob';

const METHODS = {
    UPDATE_CONFIGURATION: 'configuration/update'
};

ipcMain.on(METHODS.UPDATE_CONFIGURATION, async (event, arg) => {
    try {
        await UpdatePricesJob.updateConfig();
        UpdateStockHistoryJob.run();
        event.reply(METHODS.UPDATE_CONFIGURATION, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.UPDATE_CONFIGURATION, { status: 'error', message: e.message });
    }
});

export default {};
