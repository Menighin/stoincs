import { ipcMain } from 'electron';
import GoogleDriveService from '../services/GoogleDriveService';

const googleDriveService = new GoogleDriveService();

const METHODS = {
    LOGIN: 'google-drive/login',
    AUTO_LOGIN: 'google-drive/auto-login',
    LOGOUT: 'google-drive/logout',
    UPLOAD: 'google-drive/upload',
    DOWNLOAD: 'google-drive/download'
};

ipcMain.on(METHODS.LOGIN, async (event, arg) => {
    try {
        await googleDriveService.login(event);
        event.reply(METHODS.LOGIN, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.LOGIN, { status: 'error', message: e.message, stack: e.stack });
    }
});

ipcMain.on(METHODS.AUTO_LOGIN, async (event, arg) => {
    try {
        await googleDriveService.autoLogin();
    } catch (e) {
        event.reply(METHODS.AUTO_LOGIN, { status: 'error', message: e.message, stack: e.stack });
    }
});

ipcMain.on(METHODS.LOGOUT, async (event, arg) => {
    try {
        await googleDriveService.logout(arg.clearData);
        event.reply(METHODS.LOGOUT, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.LOGOUT, { status: 'error', message: e.message, stack: e.stack });
    }
});

ipcMain.on(METHODS.UPLOAD, async (event, arg) => {
    try {
        await googleDriveService.uploadFiles();
        event.reply(METHODS.UPLOAD, { status: 'success' });
    } catch (e) {
        if (e.message !== 'Not logged in Google Drive')
            event.reply(METHODS.UPLOAD, { status: 'error', message: e.message });
        else
            event.reply(METHODS.UPLOAD, { status: 'success' });
    }
});

ipcMain.on(METHODS.DOWNLOAD, async (event, arg) => {
    try {
        await googleDriveService.downloadFiles();
        event.reply(METHODS.DOWNLOAD, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.DOWNLOAD, { status: 'error', message: e.message });
    }
});

export default {};
