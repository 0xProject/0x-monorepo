import { web3Wrapper } from '../util/web3_wrapper';

export const getBestAddress = async (): Promise<string> => {
    const addresses = await web3Wrapper.getAvailableAddressesAsync();
    return addresses[0];
};
