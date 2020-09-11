import { ipcMain } from 'electron';
import DividendsService from '../services/DividendsService';

const METHODS = {
    GET_DIVIDENDS: 'dividends/get',
    SAVE: 'dividends/save',
    DELETE: 'dividends/delete',
    DOWNLOAD_CSV: 'dividends/download-csv',
    UPLOAD_CSV: 'dividends/upload-csv'
};

ipcMain.on(METHODS.GET_DIVIDENDS, async (event, arg) => {
    const dividends = await DividendsService.getDividendsEvents();

    try {
        event.reply(METHODS.GET_DIVIDENDS, { status: 'success', data: dividends });
    } catch (e) {
        event.reply(METHODS.GET_DIVIDENDS, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.SAVE, async (event, newDividend) => {
    try {
        const result = await DividendsService.save(newDividend);
        if (result)
            event.reply(METHODS.SAVE, { status: 'success' });
        else
            event.reply(METHODS.SAVE, { status: 'error', message: 'Operação já existe' })
    } catch (e) {
        event.reply(METHODS.SAVE, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.DELETE, async (event, dividend) => {
    try {
        await DividendsService.delete(dividend);
        event.reply(METHODS.DELETE, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.DELETE, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.DOWNLOAD_CSV, async (event, arg) => {
    try {
        await DividendsService.downloadCsv();
        event.reply(METHODS.DOWNLOAD_CSV, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.DOWNLOAD_CSV, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.UPLOAD_CSV, async (event, arg) => {
    try {
        const lines = await DividendsService.uploadCsv();
        event.reply(METHODS.UPLOAD_CSV, { status: 'success', lines: lines });
    } catch (e) {
        event.reply(METHODS.UPLOAD_CSV, { status: 'error', message: e.message });
    }
});

export default {};
