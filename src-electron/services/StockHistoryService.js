import fs from 'fs';
import { app } from 'electron';

class StockHistoryService {

    async getPath() {
        const path = `${app.getAppPath()}/data`;
        console.log(`checking for ${path}`);
        fs.promises.stat(path).catch(async () => {
            console.log(`${path} not found... Creating...`);
            await fs.promises.mkdir(path);
        });
        return path;
    }

    async getStockHistoryJobMetadata() {
        const path = app.getAppPath();
    }

}

export default StockHistoryService;
