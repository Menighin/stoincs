import { BrowserWindow } from 'electron';

class NotificationService {

    notifyStartJob() {
        BrowserWindow.getFocusedWindow().webContents.send('notification/start-job');
    }

    notifyEndJob() {
        BrowserWindow.getFocusedWindow().webContents.send('notification/end-job');
    }

    notifyLoginSuccess(data) {
        console.log('notifying');
        BrowserWindow.getFocusedWindow().webContents.send('notification/login-success', { status: 'success', data: data });
    }

}

export default NotificationService;
