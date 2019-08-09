import { assert as sharedAssert } from '@0x/assert';
// HACK: We need those two unused imports because they're actually used by sharedAssert which gets injected here
// tslint:disable:no-unused-variable
import { Schema } from '@0x/json-schemas';
import { ECSignature } from '@0x/types';
import { BigNumber } from '@0x/utils';
// tslint:enable:no-unused-variable
import { SupportedProvider } from 'ethereum-types';

import { signatureUtils } from '@0x/order-utils';

export const assert = {
    ...sharedAssert,
    async isValidSignatureAsync(
        supportedProvider: SupportedProvider,
        orderHash: string,
        signature: string,
        signerAddress: string,
        exchangeAddress?: string,
    ): Promise<void> {
        const isValid = await signatureUtils.isValidSignatureAsync(
            supportedProvider,
            orderHash,
            signature,
            signerAddress,
            exchangeAddress,
        );
        assert.assert(isValid, `Expected order with hash '${orderHash}' to have a valid signature`);
    },
};
