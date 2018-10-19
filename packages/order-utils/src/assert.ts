import { assert as sharedAssert } from '@0x/assert';
// HACK: We need those two unused imports because they're actually used by sharedAssert which gets injected here
// tslint:disable:no-unused-variable
import { Schema } from '@0x/json-schemas';
import { ECSignature, SignatureType } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { EthRPCClient } from '@0x/eth-rpc-client';
// tslint:enable:no-unused-variable
import * as _ from 'lodash';

import { utils } from './utils';

export const assert = {
    ...sharedAssert,
    async isSenderAddressAsync(
        variableName: string,
        senderAddressHex: string,
        ethRPCClient: EthRPCClient,
    ): Promise<void> {
        sharedAssert.isETHAddressHex(variableName, senderAddressHex);
        const isSenderAddressAvailable = await ethRPCClient.isSenderAddressAvailableAsync(senderAddressHex);
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
