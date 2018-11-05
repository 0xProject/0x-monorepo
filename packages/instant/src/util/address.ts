import { EthRPCClient } from '@0x/eth-rpc-client';

export const getBestAddress = async (ethRpcClient: EthRPCClient): Promise<string | undefined> => {
    const addresses = await ethRpcClient.getAvailableAddressesAsync();
    return addresses[0];
};
