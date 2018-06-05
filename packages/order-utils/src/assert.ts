import { assert as sharedAssert } from '@0xproject/assert';
// We need those two unused imports because they're actually used by sharedAssert which gets injected here
// tslint:disable-next-line:no-unused-variable
import { Schema } from '@0xproject/json-schemas';
// tslint:disable-next-line:no-unused-variable
import { ECSignature, SignatureType } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { utils } from './utils';

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
    isOneOfExpectedSignatureTypes(signature: string, signatureTypes: SignatureType[]): void {
        sharedAssert.isHexString('signature', signature);
        const signatureTypeIndexIfExists = utils.getSignatureTypeIndexIfExists(signature);
        const isExpectedSignatureType = _.includes(signatureTypes, signatureTypeIndexIfExists);
        if (!isExpectedSignatureType) {
            throw new Error(
                `Unexpected signatureType: ${signatureTypeIndexIfExists}. Valid signature types: ${signatureTypes}`,
            );
        }
    },
};
