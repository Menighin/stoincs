import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';

const FILES = {
    TREASURY_DIRECT: 'treasury_direct',
    JOB_METADATA: 'treasury_direct_job'
};

class TreasuryDirectService {

    async getTreasuryDirectJobMetadata() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.JOB_METADATA}`;

        const fileStr = (await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString();
        let result = null;
        if (fileStr.length > 0) {
            result = JSON.parse(fileStr);
            result.lastRun = new Date(result.lastRun);
        }
        return result;
    }

    async updateTreasuryDirectJobMetadata(lastRun = undefined) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.JOB_METADATA}`;

        const metadata = await this.getTreasuryDirectJobMetadata() || {};
        metadata.lastRun = typeof lastRun === 'undefined' ? new Date() : lastRun;
        await fs.promises.writeFile(path, JSON.stringify(metadata));
    }

    async getTreasuryDirect() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.TREASURY_DIRECT}`;

        const treasuryDirect = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '[]');
        return treasuryDirect;
    }

    async saveTreasuryDirect(treasuryDirect) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.TREASURY_DIRECT}`;
        await fs.promises.writeFile(path, JSON.stringify(treasuryDirect));
    }

};

export default new TreasuryDirectService();
export { FILES as TreasuryDirectFiles };
