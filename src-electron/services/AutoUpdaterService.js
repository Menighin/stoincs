import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';
import NotificationService from './NotificationService';

class AutoUpdaterService {

    /** @type {BrowserWindow} */
    _browserWindow;

    setup(window) {
        this._browserWindow = window;

        autoUpdater.on('checking-for-update', () => {
            console.log('[AUTO UPDATER] Checking for updates');
            this._browserWindow.webContents.send('auto-update', 'Checking for update...');
        });
        autoUpdater.on('update-available', (info) => {
            console.log('[AUTO UPDATER] Update available ' + JSON.stringify(info));
            NotificationService.notifyMessage('Porquinho Digital', 'Nova versão disponível!', 'fas fa-exclamation');
        });
        autoUpdater.on('update-not-available', (info) => {
            console.log('[AUTO UPDATER] Update not available');
        });
        autoUpdater.on('error', (err) => {
            console.log('[AUTO UPDATER] Error on update: ' + err.message);
            NotificationService.notifyMessage('Porquinho Digital', 'Erro ao baixar nova versão:', 'fas fa-times');
        });
        autoUpdater.on('download-progress', (progressObj) => {
            let logMessage = 'Download speed: ' + progressObj.bytesPerSecond;
            logMessage = logMessage + ' - Downloaded ' + progressObj.percent + '%';
            logMessage = logMessage + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
            console.log('[AUTO UPDATER] ' + logMessage);
            this._browserWindow.webContents.send('auto-update/progress-download', progressObj);
        });
        autoUpdater.on('update-downloaded', info => {
            console.log('[AUTO UPDATER] Update downloaded ' + JSON.stringify(info));
            this._browserWindow.webContents.send('auto-update/finish-download');
        });
    }

    checkForUpdates() {
        autoUpdater.checkForUpdates();
    }

}

export default new AutoUpdaterService();
