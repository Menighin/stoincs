import fs from 'fs';
import { app } from 'electron';

class FileSystemUtils {

    /**
     * Returns the path where the data is saved
     */
    static async getDataPath() {
        const path = `${app.getPath('userData')}/data`;
        await fs.promises.stat(path).catch(async () => {
            await fs.promises.mkdir(path);
        });
        return path;
    }

}

export default FileSystemUtils;
