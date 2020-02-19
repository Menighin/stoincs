import { ipcMain } from 'electron';

class NotificationService {

    notifyStartJob() {
        ipcMain.emit('notification/start-job');
    }

    notifyEndJob() {
        ipcMain.emit('notification/end-job');
    }

}

export default NotificationService;
