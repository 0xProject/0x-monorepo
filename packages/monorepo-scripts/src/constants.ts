import * as path from 'path';

export const constants = {
    monorepoRootPath: path.join(__dirname, '../../..'),
    stagingWebsite: 'http://staging-0xproject.s3-website-us-east-1.amazonaws.com',
    lernaExecutable: path.join('node_modules', '@0x-lerna-fork', 'lerna', 'cli.js'),
    githubPersonalAccessToken: process.env.GITHUB_PERSONAL_ACCESS_TOKEN_0X_JS,
    discordAlertWebhookUrl: process.env.DISCORD_GITHUB_RELEASE_WEBHOOK_URL,
    releasesUrl: 'https://github.com/0xProject/0x-monorepo/releases',
    dependenciesUpdatedMessage: 'Dependencies updated',
};
