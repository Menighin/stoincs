import { ipcMain } from 'electron';
import FileService from '../services/FileService';

const METHODS = {
    DOWNLOAD_FILES: 'files/download'
};

ipcMain.on(METHODS.DOWNLOAD_FILES, async (event, arg) => {
    try {
        await FileService.downloadFiles();
        event.reply(METHODS.DOWNLOAD_FILES, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.DOWNLOAD_FILES, { status: 'error', message: e.message });
    }
});

export default {};
