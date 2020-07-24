import { ipcMain } from 'electron';
import AutoUpdaterService from '../services/AutoUpdaterService';

const METHODS = {
    INSTALL: 'auto-update/install'
};

ipcMain.on(METHODS.INSTALL, async (event, arg) => {
    try {
        AutoUpdaterService.install();
        event.reply(METHODS.INSTALL, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.INSTALL, { status: 'error', message: e.message });
    }
});

export default {};
