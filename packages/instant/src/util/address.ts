import { Web3Wrapper } from '@0x/web3-wrapper';

export const getBestAddress = async (web3Wrapper: Web3Wrapper): Promise<string | undefined> => {
    const addresses = await web3Wrapper.getAvailableAddressesAsync();
    return addresses[0];
};
