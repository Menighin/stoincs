import { ipcMain } from 'electron';
import GoogleDriveService from '../services/GoogleDriveService';

const googleDriveService = new GoogleDriveService();

const METHODS = {
    LOGIN: 'google-drive/login'
};

ipcMain.on(METHODS.LOGIN, async (event, arg) => {
    try {
        event.reply(METHODS.LOGIN, { status: 'success', url: await googleDriveService.getLoginUrl() });
    } catch (e) {
        event.reply(METHODS.LOGIN, { status: 'error' });
    }
});

export default {};
