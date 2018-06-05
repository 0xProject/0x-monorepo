import { assert as sharedAssert } from '@0xproject/assert';
// We need those two unused imports because they're actually used by sharedAssert which gets injected here
// tslint:disable-next-line:no-unused-variable
import { Schema } from '@0xproject/json-schemas';
// tslint:disable-next-line:no-unused-variable
import { ECSignature } from '@0xproject/types';

import { isValidSignature } from '@0xproject/order-utils';

export const assert = {
    ...sharedAssert,
    isValidSignature(orderHash: string, ecSignature: ECSignature, signerAddress: string): void {
        const isValid = isValidSignature(orderHash, ecSignature, signerAddress);
        this.assert(isValid, `Expected order with hash '${orderHash}' to have a valid signature`);
    },
};
