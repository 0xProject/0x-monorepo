import { assert as sharedAssert } from '@0x/assert';
// HACK: We need those two unused imports because they're actually used by sharedAssert which gets injected here
import { Schema } from '@0x/json-schemas'; // tslint:disable-line:no-unused-variable
import { Order } from '@0x/types'; // tslint:disable-line:no-unused-variable
import { BigNumber } from '@0x/utils'; // tslint:disable-line:no-unused-variable
import { Web3Wrapper } from '@0x/web3-wrapper';

export const assert = {
    ...sharedAssert,
    async isSenderAddressAsync(
        variableName: string,
        senderAddressHex: string,
        web3Wrapper: Web3Wrapper,
    ): Promise<void> {
        sharedAssert.isETHAddressHex(variableName, senderAddressHex);
        const isSenderAddressAvailable = await web3Wrapper.isSenderAddressAvailableAsync(senderAddressHex);
        sharedAssert.assert(
            isSenderAddressAvailable,
            `Specified ${variableName} ${senderAddressHex} isn't available through the supplied web3 provider`,
        );
    },
};
