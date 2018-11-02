import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

export const getInjectedProvider = (): Provider => {
    const injectedProviderIfExists = (window as any).ethereum;
    if (!_.isUndefined(injectedProviderIfExists)) {
        // TODO: call enable here when implementing wallet connection flow
        return injectedProviderIfExists;
    }
    const injectedWeb3IfExists = (window as any).web3;
    if (!_.isUndefined(injectedWeb3IfExists.currentProvider)) {
        return injectedWeb3IfExists.currentProvider;
    } else {
        throw new Error(`No injected web3 found`);
    }
};
