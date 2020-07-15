import { app, BrowserWindow, nativeTheme, globalShortcut } from 'electron';
import UpdateStockHistoryJob from '../jobs/UpdateStockHistoryJob';
import UpdatePricesJob from '../jobs/UpdatePricesJob';
import UpdateTreasuryDirectJob from '../jobs/UpdateTreasuryDirectJob';
import SyncGoogleDriveJob from '../jobs/SyncGoogleDriveJob';
import NotificationService from '../services/NotificationService';
import Controllers from '../controllers/main';
import GoogleDriveService from '../services/GoogleDriveService';
import AutoUpdaterService from '../services/AutoUpdaterService';

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
let devToolsOpen = false;

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
            nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
            nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION

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
    UpdateStockHistoryJob.setup();
    UpdatePricesJob.setup(mainWindow);
    UpdateTreasuryDirectJob.setup();
    SyncGoogleDriveJob.setup(mainWindow);
    AutoUpdaterService.setup(mainWindow);
    setTimeout(() => {
        AutoUpdaterService.checkForUpdates();
    }, 5000);
}

app.on('ready', () => {
    createWindow();
    const selfWindow = mainWindow;
    mainWindow.on('close', async (e) => {
        if (forceQuit) return;
        e.preventDefault();
        const googleDriveService = new GoogleDriveService();
        if (!forceQuit && (await googleDriveService.isLogged())) {
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

    globalShortcut.register('CommandOrControl+Shift+I', () => {
        if (!devToolsOpen)
            mainWindow.openDevTools();
        else
            mainWindow.closeDevTools();

        devToolsOpen = !devToolsOpen;
    });
});

app.on('window-all-closed', async () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
