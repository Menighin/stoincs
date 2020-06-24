import { dialog } from 'electron';
import AdmZip from 'adm-zip';
import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';
import { StockHistoryFiles } from './StockHistoryService';
import { WalletFiles } from './WalletService';
import { ConfigurationFiles } from './ConfigurationService';
import { StockPriceFiles } from './StockPriceService';

class FileService {

    getFileNames() {
        return [
            ...Object.values(StockHistoryFiles),
            ...Object.values(WalletFiles),
            ...Object.values(ConfigurationFiles),
            ...Object.values(StockPriceFiles)
        ];
    }

    async downloadFiles() {
        const savePath = await dialog.showSaveDialog({ defaultPath: 'porquinho-digital.zip' });
        if (!savePath.canceled) {
            const admZip = new AdmZip();
            const dataPath = await FileSystemUtils.getDataPath();
            this.getFileNames().forEach(f => {
                admZip.addLocalFile(`${dataPath}/${f}`);
            });
            admZip.writeZip(`${dataPath}/data.zip`);

            await fs.promises.rename(`${dataPath}/data.zip`, savePath.filePath);
        }
    }

}

export default new FileService();
