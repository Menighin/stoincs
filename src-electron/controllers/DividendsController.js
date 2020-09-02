import { ipcMain } from 'electron';
import DividendsService from '../services/DividendsService';

const METHODS = {
    GET_DIVIDENDS: 'dividends/get',
    DOWNLOAD_CSV: 'dividends/download-csv'
};

ipcMain.on(METHODS.GET_DIVIDENDS, async (event, arg) => {
    const dividends = await DividendsService.getDividendsEvents();

    try {
        event.reply(METHODS.GET_DIVIDENDS, { status: 'success', data: dividends });
    } catch (e) {
        event.reply(METHODS.GET_DIVIDENDS, { status: 'error', message: e.message });
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

export default {};
