import { BrowserWindow } from 'electron';

class NotificationService {

    notifyStartJob() {
        BrowserWindow.getAllWindows()[0].webContents.send('notification/start-job');
    }

    notifyEndJob() {
        BrowserWindow.getAllWindows()[0].webContents.send('notification/end-job');
    }

    notifyLoginSuccess(data) {
        BrowserWindow.getAllWindows()[0].webContents.send('notification/login-success', { status: 'success', data: data });
    }

}

export default NotificationService;
