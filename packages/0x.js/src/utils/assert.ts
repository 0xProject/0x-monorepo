import { assert as sharedAssert } from '@0xproject/assert';
// We need those two unused imports because they're actually used by sharedAssert which gets injected here
// tslint:disable-next-line:no-unused-variable
import { Schema } from '@0xproject/json-schemas';
// tslint:disable-next-line:no-unused-variable
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { ECSignature } from '../types';
import { signatureUtils } from '../utils/signature_utils';

export const assert = {
    ...sharedAssert,
    isValidSignature(orderHash: string, ecSignature: ECSignature, signerAddress: string) {
        const isValidSignature = signatureUtils.isValidSignature(orderHash, ecSignature, signerAddress);
        this.assert(isValidSignature, `Expected order with hash '${orderHash}' to have a valid signature`);
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
    async isUserAddressAvailableAsync(web3Wrapper: Web3Wrapper): Promise<void> {
        const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
        this.assert(!_.isEmpty(availableAddresses), 'No addresses were available on the provided web3 provider');
    },
};
