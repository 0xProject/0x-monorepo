import { ZeroEx } from '0x.js';

import { crypto } from './crypto';

export const addressUtils = {
    generatePseudoRandomAddress(): string {
        const randomBigNum = ZeroEx.generatePseudoRandomSalt();
        const randomBuff = crypto.solSHA3([randomBigNum]);
        const randomAddress = `0x${randomBuff.slice(0, 20).toString('hex')}`;
        return randomAddress;
    },
};
