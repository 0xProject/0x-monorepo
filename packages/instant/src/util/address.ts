import { web3Wrapper } from '../util/web3_wrapper';

export const getBestAddress = async (): Promise<string | undefined> => {
    const addresses = await web3Wrapper.getAvailableAddressesAsync();
    return addresses[0];
};
