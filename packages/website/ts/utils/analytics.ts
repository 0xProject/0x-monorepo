import * as _ from 'lodash';
import * as ReactGA from 'react-ga';
import { InjectedWeb3 } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { utils } from 'ts/utils/utils';

export const analytics = {
    init(): void {
        ReactGA.initialize(configs.GOOGLE_ANALYTICS_ID);
    },
    logEvent(category: string, action: string, label: string, value?: any): void {
        ReactGA.event({
            category,
            action,
            label,
            value,
        });
    },
    async logProviderAsync(web3IfExists: InjectedWeb3): Promise<void> {
        await utils.onPageLoadAsync();
        const providerType =
            !_.isUndefined(web3IfExists) && !_.isUndefined(web3IfExists.currentProvider)
                ? utils.getProviderType(web3IfExists.currentProvider)
                : 'NONE';
        ReactGA.ga('set', 'dimension1', providerType);
    },
};
