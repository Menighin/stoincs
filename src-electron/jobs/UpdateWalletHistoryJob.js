import WalletHistoryService from '../services/WalletHistoryService';
import DateUtils from '../../src-shared/utils/DateUtils';
import NotificationService from '../services/NotificationService';
import CeiCrawlerService from '../services/CeiCrawlerService';
import ConfigurationService from '../services/ConfigurationService';

const NOTIFICATION = {
    TITLE: 'Performance da Carteira',
    ICON: 'fas fa-landmark'
};

class UpdateWalletHistoryJob {

    /**
     * Setup the job to run from time to time
     */
    setup() {
        setTimeout(() => this.run(), 5000);
        setInterval(() => this.run(), 1000 * 60 * 60 * 12);
    }

    async run() {
        console.log('[WALLET HISTORY JOB] Running wallet history job...');
        const evtCode = 'WALLET_HISTORY_JOB';
        NotificationService.notifyLoadingStart(evtCode, 'Crawling histórico de carteira do CEI');

        // Check whether job is enabled
        const configuration = await ConfigurationService.getConfiguration();
        if (!configuration.ceiConfig.walletHistory) {
            NotificationService.notifyLoadingFinish(evtCode);
            NotificationService.notifyMessage(NOTIFICATION.TITLE, `Busca de histórico da carteira do CEI está desligada`, NOTIFICATION.ICON);
            return;
        }

        try {
            const jobMetadata = await WalletHistoryService.getWalletHistoryJobMetadata();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            console.log('[WALLET HISTORY JOB] Last run: ' + (jobMetadata == null ? 'NEVER' : jobMetadata.lastRun));

            if (jobMetadata === null || !DateUtils.isSameDate(yesterday, jobMetadata.lastRun)) {
                console.log('[WALLET HISTORY JOB] Executing CEI Crawler - Wallet History...');

                const walletOptions = await CeiCrawlerService.getWalletOptions();
                const minDateOption = DateUtils.fromDateStr(walletOptions.minDate);
                let minDate = jobMetadata != null && jobMetadata.lastRun > minDateOption ? jobMetadata.lastRun : minDateOption;
                let dayBeforeMin = new Date(minDate.getTime() - 1000 * 60 * 60 * 24);
                const maxDate = DateUtils.fromDateStr(walletOptions.maxDate);

                console.log(`[WALLET HISTORY JOB] Will get history from ${DateUtils.toString(minDate, true, false)} to ${DateUtils.toString(maxDate, true, false)}`);

                while (minDate <= maxDate) {
                    console.log(`[WALLET HISTORY JOB] Processing wallet on ${DateUtils.toString(minDate, true, false)}`);

                    if (minDate.getDay() !== 6) {
                        NotificationService.notifyLoadingStart(evtCode, `Crawling histórico de carteira do CEI - ${DateUtils.toString(minDate, true, false)}`);
                        const wallet = await CeiCrawlerService.getWallet(minDate);
                        await WalletHistoryService.saveWalletHistoryFromJob(wallet, dayBeforeMin);
                    } else {
                        console.log(`[WALLET HISTORY JOB] Won't process ${DateUtils.toString(minDate, true, false)} because its sunday`);
                    }
                    await WalletHistoryService.updateWalletHistoryJobMetadata(minDate);
                    dayBeforeMin = minDate;
                    minDate = new Date(minDate.getTime() + 1000 * 60 * 60 * 24);
                }

                NotificationService.notifyMessage(NOTIFICATION.TITLE, `Histórico da Carteira foi atualizado até ${DateUtils.toString(maxDate, true, false)}!`, NOTIFICATION.ICON);
            } else {
                NotificationService.notifyMessage(NOTIFICATION.TITLE, `Histórico da Carteira já estava atualizado com o CEI`, NOTIFICATION.ICON);
            }
        } catch (e) {
            console.log('[WALLET HISTORY JOB] Erro Wallet History crawler');
            console.log(e);
            NotificationService.notifyMessage(NOTIFICATION.TITLE, `Erro ao buscar histórico de carteira no CEI: ${e.message}`, NOTIFICATION.ICON);
        }
        NotificationService.notifyLoadingFinish(evtCode);
    }

}

export default new UpdateWalletHistoryJob();
