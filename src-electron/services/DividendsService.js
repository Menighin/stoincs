import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';

const FILES = {
    DIVIDENDS: 'dividends',
    JOB_METADATA: 'dividends_job'
};

class DividendsService {

    async getDividendsJobMetadata() {
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

    async updateDividendsJobMetadata(lastRun = undefined) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.JOB_METADATA}`;

        const metadata = await this.getDividendsJobMetadata() || {};
        metadata.lastRun = typeof lastRun === 'undefined' ? new Date() : lastRun;
        await fs.promises.writeFile(path, JSON.stringify(metadata));
    }

    async getDividends() {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.DIVIDENDS}`;

        const dividends = JSON.parse((await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString() || '[]');
        dividends.forEach(d => {
            d.events.forEach(e => {
                e.date = new Date(e.date);
            });
        });
        return dividends;
    }

    async getDividendsEvents() {
        return (await this.getDividends())
            .reduce((p, c) => {
                p = [...p, ...c.events.map(e => ({
                    ...e,
                    date: new Date(e.date),
                    institution: c.institution,
                    account: c.account
                }))];
                return p;
            }, []);
    }

    async saveDividendsFromJob(dividendsCei) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.DIVIDENDS}`;
        const dividends = await this.getDividends();

        dividendsCei.forEach(cei => {
            const alreadyExistsAccount = dividends
                .any(d => d.institution === cei.institution && d.account === cei.account);

            const savedDividend = alreadyExistsAccount
                ? dividends.first(d => d.institution === cei.institution && d.account === cei.account)
                : {
                    institution: cei.institution,
                    account: cei.account,
                    events: []
                };

            // If there's no dividend data for this account and institution, add it
            if (!alreadyExistsAccount) dividends.push(savedDividend);

            cei.pastEvents.forEach(e => {
                const id = this.getEventId(e);
                if (!savedDividend.events.any(o => o.id === id))
                    savedDividend.events.push({
                        id: id,
                        ...e
                    });
            });
        });

        await fs.promises.writeFile(path, JSON.stringify(dividends));
    }

    getEventId(e) {
        return `${e.code}_${e.quantity}_${e.date.getFullYear()}${e.date.getMonth()}${e.date.getDay()}`;
    }

};

export default new DividendsService();
export { FILES as DividendsFiles };
