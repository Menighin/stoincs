import { ipcMain } from 'electron';
import TreasuryDirectService from '../services/TreasuryDirectService';

const METHODS = {
    GET_TREASURY_DIRECT: 'treasury-direct/get'
};

ipcMain.on(METHODS.GET_TREASURY_DIRECT, async (event, arg) => {
    const treasuryDirect = await TreasuryDirectService.getTreasuryDirect();

    try {
        event.reply(METHODS.GET_TREASURY_DIRECT, { status: 'success', data: treasuryDirect });
    } catch (e) {
        event.reply(METHODS.GET_TREASURY_DIRECT, { status: 'error', message: e.message });
    }
});

export default {};
