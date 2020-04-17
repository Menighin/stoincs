import { app, BrowserWindow, nativeTheme } from 'electron';
import UpdateStockHistoryJob from '../jobs/UpdateStockHistoryJob';
import UpdatePricesJob from '../jobs/UpdatePricesJob';
import SyncGoogleDriveJob from '../jobs/SyncGoogleDriveJob';
import StockHistoryService from '../services/StockHistoryService';
import NotificationService from '../services/NotificationService';
import Controllers from '../controllers/main';
import GoogleDriveService from '../services/GoogleDriveService';

try {
    if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
        require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions'));
    }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
    global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\');
}

let mainWindow;
let forceQuit = false;

function createWindow() {
    /**
   * Initial window options
   */
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        useContentSize: true,
        webPreferences: {
            // Change from /quasar.conf.js > electron > nodeIntegration;
            // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
            nodeIntegration: QUASAR_NODE_INTEGRATION

            // More info: /quasar-cli/developing-electron-apps/electron-preload-script
            // preload: path.resolve(__dirname, 'electron-preload.js')
        }
    });

    mainWindow.loadURL(process.env.APP_URL);
    mainWindow.removeMenu();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    NotificationService.setup(mainWindow);
    UpdateStockHistoryJob.setup(new StockHistoryService(), mainWindow);
    UpdatePricesJob.setup(mainWindow);
    SyncGoogleDriveJob.setup(mainWindow);
}

app.on('ready', () => {
    createWindow();
    const selfWindow = mainWindow;
    mainWindow.on('close', async (e) => {
        if (forceQuit) return;
        e.preventDefault();
        const googleDriveService = new GoogleDriveService();
        if (!forceQuit && (await googleDriveService.isLogged())) {
            console.log('CLOSE EVENT 1');
            selfWindow.webContents.send('app/quiting');
            await googleDriveService.uploadFiles();
            forceQuit = true;
            setTimeout(() => {
                app.quit();
            }, 2000);
        } else {
            forceQuit = true;
            app.quit();
        }
    });

    mainWindow.openDevTools();

});

app.on('window-all-closed', async () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    console.log('window-all-closed');
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
