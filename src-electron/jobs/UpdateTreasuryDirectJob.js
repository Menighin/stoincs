import TreasuryDirectService from '../services/TreasuryDirectService';
import DateUtils from '../../src-shared/utils/DateUtils';
import NotificationService from '../services/NotificationService';
import CeiCrawlerService from '../services/CeiCrawlerService';

const NOTIFICATION = {
    TITLE: 'Tesouro Direto',
    ICON: 'fas fa-landmark'
};

class UpdateTreasuryDirectJob {

    /**
     * Setup the job to run from time to time
     */
    setup() {
        setTimeout(() => this.run(), 15000);
        setInterval(() => this.run(), 1000 * 60 * 60 * 12);
    }

    async run() {
        console.log('[TREASURY DIRECT JOB] Running stock treasury direct...');
        const evtCode = 'TREASURY_DIRECT_JOB';
        NotificationService.notifyLoadingStart(evtCode, 'Crawling tesouro direto do CEI');

        try {
            const jobMetadata = await TreasuryDirectService.getTreasuryDirectJobMetadata();
            const now = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            console.log('[TREASURY DIRECT JOB] Last run: ' + (jobMetadata == null ? 'NEVER' : jobMetadata.lastRun));

            if (jobMetadata === null || !DateUtils.isSameDate(yesterday, jobMetadata.lastRun)) {
                console.log('[TREASURY DIRECT JOB] Executing CEI Crawler - Treasury Direct...');
                const wallets = await CeiCrawlerService.getWallet(yesterday);
                const treasuryDirect = wallets.reduce((data, account) => {
                    account.nationalTreasuryWallet.forEach(treasure => {
                        if (!data[treasure.code])
                            data[treasure.code] = {
                                code: treasure.code,
                                expirationDate: treasure.expirationDate,
                                investedValue: 0,
                                grossValue: 0,
                                netValue: 0,
                                quantity: 0
                            };

                        data[treasure.code].investedValue += treasure.investedValue;
                        data[treasure.code].grossValue += treasure.grossValue;
                        data[treasure.code].netValue += treasure.netValue;
                        data[treasure.code].quantity += treasure.quantity;
                        data[treasure.code].lastUpdated = now;
                    });
                    return data;
                }, {});

                await TreasuryDirectService.saveTreasuryDirect(Object.values(treasuryDirect));
                await TreasuryDirectService.updateTreasuryDirectJobMetadata();
                NotificationService.notifyMessage(NOTIFICATION.TITLE, `Tesouro direto foi atualizado!`, NOTIFICATION.ICON);
            } else {
                NotificationService.notifyMessage(NOTIFICATION.TITLE, `Tesouro direto já estava atualizado com o CEI`, NOTIFICATION.ICON);
            }
        } catch (e) {
            console.log('[TREASURY DIRECT JOB] Erro TreasuryDirect crawler');
            console.log(e);
            NotificationService.notifyMessage(NOTIFICATION.TITLE, `Erro ao buscar tesouro direto no CEI: ${e.message}`, NOTIFICATION.ICON);
        }
        NotificationService.notifyLoadingFinish(evtCode);
    }

}

export default new UpdateTreasuryDirectJob();
