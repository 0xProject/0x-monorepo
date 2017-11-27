import {assert as sharedAssert} from '@0xproject/assert';
import {Schema, SchemaValidator} from '@0xproject/json-schemas';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import {ECSignature} from '../types';
import {signatureUtils} from '../utils/signature_utils';
import {Web3Wrapper} from '../web3_wrapper';

const HEX_REGEX = /^0x[0-9A-F]*$/i;

export const assert = {
    ...sharedAssert,
    isValidSignature(orderHash: string, ecSignature: ECSignature, signerAddress: string) {
        const isValidSignature = signatureUtils.isValidSignature(orderHash, ecSignature, signerAddress);
        this.assert(isValidSignature, `Expected order with hash '${orderHash}' to have a valid signature`);
    },
    async isSenderAddressAsync(variableName: string, senderAddressHex: string,
                               web3Wrapper: Web3Wrapper): Promise<void> {
        sharedAssert.isETHAddressHex(variableName, senderAddressHex);
        const isSenderAddressAvailable = await web3Wrapper.isSenderAddressAvailableAsync(senderAddressHex);
        sharedAssert.assert(isSenderAddressAvailable,
            `Specified ${variableName} ${senderAddressHex} isn't available through the supplied web3 provider`,
        );
    },
    async isUserAddressAvailableAsync(web3Wrapper: Web3Wrapper): Promise<void> {
        const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
        this.assert(!_.isEmpty(availableAddresses), 'No addresses were available on the provided web3 provider');
    },
};
