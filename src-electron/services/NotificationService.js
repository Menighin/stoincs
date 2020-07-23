import { BrowserWindow } from 'electron';

class NotificationService {

    /** @type {BrowserWindow} */
    _browserWindow;

    /**
     * Setup the Notification Service
     * @param {BrowserWindow} browserWindow Browser window to be notified
     */
    setup(browserWindow) {
        this._browserWindow = browserWindow;
    }

    notifyLoadingStart(code, message) {
        this._browserWindow.webContents.send('notification/start-loading', { data: { code: code, message: message } });
    }

    notifyLoadingFinish(evtCode) {
        this._browserWindow.webContents.send('notification/finish-loading', { data: evtCode });
    }

    notifyLoginSuccess(data) {
        this._browserWindow.webContents.send('notification/login-success', { status: 'success', data: data });
    }

    notifyMessage(title, message, icon) {
        this._browserWindow.webContents.send('notification/message', { data: {
            title: title,
            message: message,
            icon: icon
        } });
    }

    notifyLog(msg) {
        this._browserWindow.webContents.send('notification/log', { data: {
            message: msg
        } });
    }

}

export default new NotificationService();
