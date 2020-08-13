import { ipcMain, app } from 'electron';
import AutoUpdaterService from '../services/AutoUpdaterService';
import AboutStoincs from '../resources/AboutStoincs';

const METHODS = {
    GET: 'about/get'
};

ipcMain.on(METHODS.GET, async (event, arg) => {
    try {
        event.reply(METHODS.GET, { status: 'success', data: { ...AboutStoincs, version: app.getVersion() } });
    } catch (e) {
        event.reply(METHODS.GET, { status: 'error', message: e.message });
    }
});

export default {};
