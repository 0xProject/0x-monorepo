import { assert as sharedAssert } from '@0xproject/assert';
// HACK: We need those two unused imports because they're actually used by sharedAssert which gets injected here
// tslint:disable:no-unused-variable
import { Schema } from '@0xproject/json-schemas';
import { ECSignature } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
// tslint:enable:no-unused-variable
import { Provider } from 'ethereum-types';

import { isValidSignatureAsync } from '@0xproject/order-utils';

export const assert = {
    ...sharedAssert,
    async isValidSignatureAsync(
        provider: Provider,
        orderHash: string,
        signature: string,
        signerAddress: string,
    ): Promise<void> {
        const isValid = await isValidSignatureAsync(provider, orderHash, signature, signerAddress);
        assert.assert(isValid, `Expected order with hash '${orderHash}' to have a valid signature`);
    },
};
