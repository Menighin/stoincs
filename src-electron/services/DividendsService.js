import fs from 'fs';
import FileSystemUtils from '../utils/FileSystemUtils';

const FILES = {
    DIVIDENDS: 'dividends',
    JOB_METADATA: 'dividends_job'
};

class DividendsService {

    _compareDividendOrder = (a, b) => {
        if (a.date === null) return -1;
        if (b.date === null) return 1;
        return b.date.getTime() - a.date.getTime();
    };

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
            d.pastEvents.forEach(e => {
                if (e.date)
                    e.date = new Date(e.date);
            });
            d.futureEvents.forEach(e => {
                if (e.date)
                    e.date = new Date(e.date);
            });
        });
        return dividends;
    }

    async getDividendsEvents() {
        return (await this.getDividends())
            .reduce((p, c) => {
                p = [
                    ...p,
                    ...c.pastEvents.map(e => ({
                        ...e,
                        date: e.date ? new Date(e.date) : null,
                        institution: c.institution,
                        account: c.account,
                        isFuture: false
                    })),
                    ...c.futureEvents.map(e => ({
                        ...e,
                        date: e.date ? new Date(e.date) : null,
                        institution: c.institution,
                        account: c.account,
                        isFuture: true
                    }))
                ];
                return p;
            }, [])
            .sort(this._compareDividendOrder);
    }

    async saveDividendsFromJob(dividendsCei) {
        const rootPath = await FileSystemUtils.getDataPath();
        const path = `${rootPath}/${FILES.DIVIDENDS}`;
        const dividends = await this.getDividends();
        let newDividends = 0;
        dividendsCei.forEach(cei => {
            const alreadyExistsAccount = dividends
                .any(d => d.institution === cei.institution && d.account === cei.account);

            const savedAccount = alreadyExistsAccount
                ? dividends.first(d => d.institution === cei.institution && d.account === cei.account)
                : {
                    institution: cei.institution,
                    account: cei.account,
                    pastEvents: [],
                    futureEvents: []
                };

            // If there's no dividend data for this account and institution, add it
            if (!alreadyExistsAccount) dividends.push(savedAccount);

            cei.pastEvents.forEach(e => {
                const id = this.getEventId(e);
                if (!savedAccount.pastEvents.any(o => o.id === id)) {
                    newDividends++;
                    savedAccount.pastEvents.push({
                        id: id,
                        code: e.code,
                        stockType: e.stockType,
                        type: e.type,
                        quantity: e.quantity,
                        date: e.date,
                        grossValue: e.grossValue,
                        netValue: e.netValue,
                        source: 'CEI'
                    });
                }
            });
            savedAccount.futureEvents = cei.futureEvents.map(e => ({
                code: e.code,
                stockType: e.stockType,
                type: e.type,
                quantity: e.quantity,
                date: e.date,
                grossValue: e.grossValue,
                netValue: e.netValue,
                source: 'CEI'
            }));
        });

        dividends.forEach(d => {
            d.pastEvents.sort(this._compareDividendOrder);
            d.futureEvents.sort(this._compareDividendOrder);
        });

        await fs.promises.writeFile(path, JSON.stringify(dividends));
        return newDividends;
    }

    getEventId(e) {
        return `${e.code}_${e.quantity}_${e.date.getFullYear()}${e.date.getMonth()}${e.date.getDate()}`;
    }

};

export default new DividendsService();
export { FILES as DividendsFiles };
