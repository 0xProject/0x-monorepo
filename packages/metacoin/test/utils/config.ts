import { devConstants } from '@0xproject/dev-utils';
import * as path from 'path';

export const config = {
    networkId: 50,
    artifactsDir: path.resolve(__dirname, '../../artifacts'),
    contractsDir: path.resolve(__dirname, '../../contracts'),
    ganacheLogFile: 'ganache.log',
    defaults: {
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    },
    mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
};
