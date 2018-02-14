import { BigNumber } from '@0xproject/utils';

export const constants = {
    networkId: 0,
    jsonrpcPort: 8545,
    optimizerEnabled: 0,
    gasPrice: new BigNumber(20000000000),
    timeoutMs: 20000,
    zrxTokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
    tokenTransferProxyAddress: '0x8da0d80f5007ef1e431dd2127178d224e32c2ef4',
    contractsToCompile: '*',
};
