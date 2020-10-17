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
                    const key = `${account.institution}-${account.account}`;

                    if (!data[key])
                        data[key] = {
                            institution: account.institution,
                            account: account.account,
                            data: []
                        };
                    
                    account.nationalTreasuryWallet.forEach(treasure => {
                        data[key].data.push({
                            code: treasure.code,
                            expirationDate: treasure.expirationDate,
                            investedValue: treasure.investedValue,
                            grossValue:treasure.grossValue,
                            netValue: treasure.netValue,
                            quantity:  treasure.quantity,
                            lastUpdated: now,
                            source: 'CEI'
                        });
                    });
                    return data;
                }, {});

                await TreasuryDirectService.saveTreasuryDirectFromJob(Object.values(treasuryDirect));
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
        NotificationService.notifyPage('treasury-direct/finish-cei');
    }

}

export default new UpdateTreasuryDirectJob();
