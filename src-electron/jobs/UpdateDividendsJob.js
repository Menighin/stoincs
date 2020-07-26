import DividendsService from '../services/DividendsService';
import DateUtils from '../utils/DateUtils';
import NotificationService from '../services/NotificationService';
import CeiCrawlerService from '../services/CeiCrawlerService';

const NOTIFICATION = {
    TITLE: 'Dividendos',
    ICON: 'fas fa-landmark'
};

class UpdateDividendsJob {

    /**
     * Setup the job to run from time to time
     */
    setup() {
        setTimeout(() => this.run(), 15000);
        setInterval(() => this.run(), 1000 * 60 * 60 * 12);
    }

    async run() {
        console.log('[DIVIDENDS JOB] Running job dividends...');
        const evtCode = 'DIVIDENDS_JOB';
        NotificationService.notifyLoadingStart(evtCode, 'Crawling dividendos no CEI');

        try {
            const jobMetadata = await DividendsService.getDividendsJobMetadata();
            const now = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            console.log('[DIVIDENDS JOB] Last run: ' + (jobMetadata == null ? 'NEVER' : jobMetadata.lastRun));

            if (jobMetadata === null || !DateUtils.isSameDate(now, jobMetadata.lastRun)) {
                console.log('[DIVIDENDS JOB] Executing CEI Crawler - Dividends...');
                const dividends = await CeiCrawlerService.getDividends();

                await DividendsService.saveDividendsFromJob(dividends);
                await DividendsService.updateDividendsJobMetadata();
                NotificationService.notifyMessage(NOTIFICATION.TITLE, `Dividendos foram atualizados!`, NOTIFICATION.ICON);
            } else {
                NotificationService.notifyMessage(NOTIFICATION.TITLE, `Dividendos já estão atualizados com o CEI`, NOTIFICATION.ICON);
            }
        } catch (e) {
            console.log('[DIVIDENDS JOB] Erro Dividends crawler');
            console.log(e);
            NotificationService.notifyMessage(NOTIFICATION.TITLE, `Erro ao buscar dividendos no CEI: ${e.message}`, NOTIFICATION.ICON);
        }
        NotificationService.notifyLoadingFinish(evtCode);
    }

}

export default new UpdateDividendsJob();
