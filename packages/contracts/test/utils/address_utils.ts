import { crypto, generatePseudoRandomSalt } from '@0xproject/order-utils';

export const addressUtils = {
    generatePseudoRandomAddress(): string {
        const randomBigNum = generatePseudoRandomSalt();
        const randomBuff = crypto.solSHA3([randomBigNum]);
        const randomAddress = `0x${randomBuff.slice(0, 20).toString('hex')}`;
        return randomAddress;
    },
};
