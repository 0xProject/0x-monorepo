import EthereumTx = require('ethereumjs-tx');

import { configs } from './configs';

type Callback = (err: Error | null, accounts: any) => void;

export const idManagement = {
    getAccounts(callback: Callback) {
        callback(null, [configs.DISPENSER_ADDRESS]);
    },
    approveTransaction(txData: object, callback: Callback) {
        callback(null, true);
    },
    signTransaction(txData: object, callback: Callback) {
        const tx = new EthereumTx(txData);
        const privateKeyBuffer = new Buffer(configs.DISPENSER_PRIVATE_KEY as string, 'hex');
        tx.sign(privateKeyBuffer);
        const rawTx = `0x${tx.serialize().toString('hex')}`;
        callback(null, rawTx);
    },
};
