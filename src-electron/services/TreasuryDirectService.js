import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';

const FILES = {
    TREASURY_DIRECT: 'treasury_direct'
};

class TreasuryDirectService {

    async getTreasuryDirect() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.TREASURY_DIRECT}`;

        const treasuryDirect = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '{}');
        return treasuryDirect;
    }

    async saveTreasuryDirectFromJob(treasuryDirect) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.TREASURY_DIRECT}`;
        await fs.promises.writeFile(path, JSON.stringify(treasuryDirect));
    }

};

export default new TreasuryDirectService();
export { FILES as TreasuryDirectFiles };
