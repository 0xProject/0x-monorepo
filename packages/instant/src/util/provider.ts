import { Provider } from 'ethereum-types';

export const getProvider = (): Provider => {
    const injectedWeb3 = (window as any).web3 || undefined;
    try {
        // Use MetaMask/Mist provider
        return injectedWeb3.currentProvider;
    } catch (err) {
        // Throws when user doesn't have MetaMask/Mist running
        throw new Error(`No injected web3 found: ${err}`);
    }
};
