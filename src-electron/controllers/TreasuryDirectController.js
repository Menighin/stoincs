import { ipcMain } from 'electron';
import TreasuryDirectService from '../services/TreasuryDirectService';

const METHODS = {
    GET_TREASURY_DIRECT: 'treasury-direct/get',
    SAVE: 'treasury-direct/save',
    DELETE: 'treasury-direct/delete',
    UPDATE: 'treasury-direct/update',
    DOWNLOAD_CSV: 'treasury-direct/download-csv',
    UPLOAD_CSV: 'treasury-direct/upload-csv'
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
    try {
        const result = await TreasuryDirectService.saveNewOperation(newOperation);
        if (result)
            event.reply(METHODS.SAVE, { status: 'success', data: newOperation });
        else
            event.reply(METHODS.SAVE, { status: 'error', message: `Operação ${newOperation.code} já existe!` });
    } catch (e) {
        event.reply(METHODS.SAVE, { status: 'error', message: e.message });
    }
});

ipcMain.on(METHODS.UPDATE, async (event, operation) => {
    await TreasuryDirectService.updateOperation(operation);
    try {
        event.reply(METHODS.UPDATE, { status: 'success', data: operation });
    } catch (e) {
        event.reply(METHODS.UPDATE, { status: 'error', message: e.message });
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

ipcMain.on(METHODS.UPLOAD_CSV, async (event, arg) => {
    try {
        await TreasuryDirectService.uploadCsv();
        event.reply(METHODS.UPLOAD_CSV, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.UPLOAD_CSV, { status: 'error', message: e.message });
    }
});

export default {};
