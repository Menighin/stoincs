import { BrowserWindow } from 'electron';
import GoogleDriveService from '../services/GoogleDriveService';
import NotificationService from '../services/NotificationService';

class SyncGoogleDriveJob {

    /** @type {BrowserWindow} */
    _browserWindow;

    /** @type {GoogleDriveService} */
    _googleDriveService;

    _interval;

    constructor() {
        this._googleDriveService = new GoogleDriveService();
    }

    /**
     * Setup the job
     * @param {BrowserWindow} browserWindow Browser window to be notified
     */
    async setup(browserWindow) {
        this._browserWindow = browserWindow;

        this._configuration = JSON.parse(await this._browserWindow.webContents.executeJavaScript('localStorage.getItem("configuration/price-update");', true));

        if (this._configuration && this._configuration.when > 0) {
            this._interval = setInterval(() => { this.run() }, this._configuration.when * 1000 * 60);
        }
    }

    async startJob() {
        this._interval = setInterval(async () => { await this.run() }, 1000 * 60 * 5);
    }

    async stopJob() {
        clearInterval(this._interval);
    }

    async run() {
        try {
            await this._googleDriveService.uploadFiles();
            this._browserWindow.webContents.send('google-drive/upload', { status: 'success' });
        } catch (e) {
            if (e.message !== 'Not logged in Google Drive')
                this._browserWindow.webContents.send('google-drive/upload', { status: 'error', message: e.message });
        }
    }

}

export default new SyncGoogleDriveJob();
