import * as EthereumTx from 'ethereumjs-tx';

import {configs} from './configs';

type Callback = (err: Error, accounts: any) => void;

export const idManagement = {
    getAccounts(callback: Callback) {
        /* tslint:disable */
        console.log('configs.DISPENSER_ADDRESS', configs.DISPENSER_ADDRESS);
        /* tslint:enable */
        callback(null, [
            configs.DISPENSER_ADDRESS,
        ]);
    },
    approveTransaction(txData: object, callback: Callback) {
        callback(null, true);
    },
    signTransaction(txData: object, callback: Callback) {
        /* tslint:disable */
        let tx = new EthereumTx(txData);
        /* tslint:enable */
        const privateKeyBuffer = new Buffer(configs.DISPENSER_PRIVATE_KEY, 'hex');
        tx.sign(privateKeyBuffer);
        const rawTx = `0x${tx.serialize().toString('hex')}`;
        callback(null, rawTx);
    },
};
