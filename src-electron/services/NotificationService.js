import { BrowserWindow } from 'electron';

class NotificationService {

    notifyLoadingStart(evt) {
        BrowserWindow.getAllWindows()[0].webContents.send('notification/start-loading', { data: evt });
    }

    notifyLoadingFinish(evtCode) {
        BrowserWindow.getAllWindows()[0].webContents.send('notification/finish-loading', { data: evtCode });
    }

    notifyLoginSuccess(data) {
        BrowserWindow.getAllWindows()[0].webContents.send('notification/login-success', { status: 'success', data: data });
    }

    notifyMessage(message) {
        BrowserWindow.getAllWindows()[0].webContents.send('notification/message', { data: message });
    }

}

export default NotificationService;
