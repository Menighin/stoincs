import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';

const FILES = {
    CONFIGURATION: 'configuration'
};

class ConfigurationService {

    async getConfiguration() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.CONFIGURATION}`;

        const configurations = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '{}');
        return configurations;
    }

    async saveConfiguration(configuration) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.CONFIGURATION}`;
        await fs.promises.writeFile(path, JSON.stringify(configuration));
    }

}

export default new ConfigurationService();
export { FILES as ConfigurationFiles };
