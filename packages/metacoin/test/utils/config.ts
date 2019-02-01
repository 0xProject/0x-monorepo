import { devConstants } from '@0x/dev-utils';

export const config = {
    networkId: 50,
    artifactsDir: 'artifacts',
    contractsDir: 'contracts',
    ganacheLogFile: 'ganache.log',
    txDefaults: {
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    },
    mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
};
