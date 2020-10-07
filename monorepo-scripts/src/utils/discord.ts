import { fetchAsync } from '@0x/utils';

import { constants } from '../constants';

import { utils } from './utils';

export const alertDiscordAsync = async (releaseNotes: string): Promise<void> => {
    const webhookUrl = constants.discordAlertWebhookUrl;
    if (webhookUrl === undefined) {
        throw new Error("No discord webhook url, can't alert");
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
    return;
};
