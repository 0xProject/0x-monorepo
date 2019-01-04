import { fetchAsync } from '@0x/utils';

import { constants } from '../constants';

import { utils } from './utils';

export const alertDiscordAsync = async (releaseNotes: string): Promise<boolean> => {
    const webhookUrl = constants.discordAlertWebhookUrl;
    if (!webhookUrl) {
        utils.log('Not alerting to discord because webhook url not set');
        return false;
    }

    utils.log('Alerting discord...');
    const payload = {
        content: `New monorepo package released!  View at ${constants.releasesUrl} \n\n ${releaseNotes}`,
    };
    await fetchAsync(webhookUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return true;
};
