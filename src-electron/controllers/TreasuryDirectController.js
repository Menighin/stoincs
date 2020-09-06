import { ipcMain } from 'electron';
import TreasuryDirectService from '../services/TreasuryDirectService';

const METHODS = {
    GET_TREASURY_DIRECT: 'treasury-direct/get',
    SAVE: 'treasury-direct/save',
    DELETE: 'treasury-direct/delete',
    DOWNLOAD_CSV: 'treasury-direct/download-csv'
};

ipcMain.on(METHODS.GET_TREASURY_DIRECT, async (event, arg) => {
    const treasuryDirect = await TreasuryDirectService.getTreasuryDirectFlat();

    try {
        event.reply(METHODS.GET_TREASURY_DIRECT, { status: 'success', data: treasuryDirect });
    } catch (e) {
        event.reply(METHODS.GET_TREASURY_DIRECT, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.SAVE, async (event, newOperation) => {
    await TreasuryDirectService.saveNewOperation(newOperation);

    try {
        event.reply(METHODS.SAVE, { status: 'success', data: newOperation });
    } catch (e) {
        event.reply(METHODS.SAVE, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.DELETE, async (event, treasuryDirect) => {
    try {
        TreasuryDirectService.delete(treasuryDirect);
        event.reply(METHODS.DELETE, { status: 'success', data: treasuryDirect });
    } catch (e) {
        event.reply(METHODS.DELETE, { status: 'error', error: e });
    }
});

ipcMain.on(METHODS.DOWNLOAD_CSV, async (event, arg) => {
    try {
        await TreasuryDirectService.downloadCsv();
        event.reply(METHODS.DOWNLOAD_CSV, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.DOWNLOAD_CSV, { status: 'error', message: e.message });
    }
});

export default {};
