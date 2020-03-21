import { ipcMain } from 'electron';
import GoogleDriveService from '../services/GoogleDriveService';

const googleDriveService = new GoogleDriveService();

const METHODS = {
    LOGIN: 'google-drive/login',
    AUTO_LOGIN: 'google-drive/auto-login',
    LOGOUT: 'google-drive/logout'
};

ipcMain.on(METHODS.LOGIN, async (event, arg) => {
    try {
        await googleDriveService.login();
        event.reply(METHODS.LOGIN, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.LOGIN, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.AUTO_LOGIN, async (event, arg) => {
    try {
        await googleDriveService.autoLogin();
    } catch (e) {
        event.reply(METHODS.LOGIN, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.LOGOUT, async (event, arg) => {
    try {
        await googleDriveService.logout();
        event.reply(METHODS.LOGOUT, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.LOGOUT, { status: 'error', message: e.message });
    }
});

export default {};
