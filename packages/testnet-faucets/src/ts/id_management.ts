import EthereumTx = require('ethereumjs-tx');
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { configs } from './configs';

type Callback = (err: Error | null, result: any) => void;

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
    signMessage(message: object, callback: Callback) {
        const data = _.get(message, 'data');
        if (_.isUndefined(data)) {
            callback(new Error('No data to sign'), null);
        }
        const privateKeyBuffer = new Buffer(configs.DISPENSER_PRIVATE_KEY as string, 'hex');
        const dataBuff = ethUtil.toBuffer(data);
        const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
        const sig = ethUtil.ecsign(msgHashBuff, privateKeyBuffer);
        const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
        callback(null, rpcSig);
    },
};
