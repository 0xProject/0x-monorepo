import * as bowser from 'bowser';
import * as _ from 'lodash';

export const utils = {
    getColSize(items: number): number {
        const bassCssGridSize = 12; // Source: http://basscss.com/#basscss-grid
        const colSize = bassCssGridSize / items;
        if (!_.isInteger(colSize)) {
            throw new Error(`Number of cols must be divisible by ${bassCssGridSize}`);
        }
        return colSize;
    },
    getCurrentBaseUrl(): string {
        const port = window.location.port;
        const hasPort = !_.isUndefined(port);
        const baseUrl = `https://${window.location.hostname}${hasPort ? `:${port}` : ''}`;
        return baseUrl;
    },
    onPageLoadPromise: new Promise<void>((resolve, _reject) => {
        if (document.readyState === 'complete') {
            resolve();
            return;
        }
        window.onload = () => resolve();
    }),
    openUrl(url: string): void {
        window.open(url, '_blank');
    },
    isMobileOperatingSystem(): boolean {
        return bowser.mobile;
    },
};
