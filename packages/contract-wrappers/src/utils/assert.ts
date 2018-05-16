import { assert as sharedAssert } from '@0xproject/assert';
// We need those two unused imports because they're actually used by sharedAssert which gets injected here
// tslint:disable-next-line:no-unused-variable
import { Schema } from '@0xproject/json-schemas';
// tslint:disable-next-line:no-unused-variable
import { ECSignature } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { isValidSignature } from '@0xproject/order-utils';

export const assert = {
    ...sharedAssert,
    isValidSignature(orderHash: string, ecSignature: ECSignature, signerAddress: string): void {
        const isValid = isValidSignature(orderHash, ecSignature, signerAddress);
        this.assert(isValid, `Expected order with hash '${orderHash}' to have a valid signature`);
    },
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
