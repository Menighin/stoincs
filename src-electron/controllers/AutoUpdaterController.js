import { ipcMain } from 'electron';

const METHODS = {
    INSTALL: 'about/info'
};

ipcMain.on(METHODS.INSTALL, async (event, arg) => {
    try {
        event.reply(METHODS.INSTALL, { status: 'success' });
    } catch (e) {
        event.reply(METHODS.INSTALL, { status: 'error', message: e.message });
    }
});

export default {};
