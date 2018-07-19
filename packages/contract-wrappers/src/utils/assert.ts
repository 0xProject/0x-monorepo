import { assert as sharedAssert } from '@0xproject/assert';
// HACK: We need those two unused imports because they're actually used by sharedAssert which gets injected here
import { Schema } from '@0xproject/json-schemas'; // tslint:disable-line:no-unused-variable
import { isValidSignatureAsync } from '@0xproject/order-utils';
import { ECSignature } from '@0xproject/types'; // tslint:disable-line:no-unused-variable
import { BigNumber } from '@0xproject/utils'; // tslint:disable-line:no-unused-variable
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';

export const assert = {
    ...sharedAssert,
    async isValidSignatureAsync(
        provider: Provider,
        orderHash: string,
        signature: string,
        signerAddress: string,
    ): Promise<void> {
        const isValid = await isValidSignatureAsync(provider, orderHash, signature, signerAddress);
        this.assert(isValid, `Expected order with hash '${orderHash}' to have a valid signature`);
    },
    isValidSubscriptionToken(variableName: string, subscriptionToken: string): void {
        const uuidRegex = new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$');
        const isValid = uuidRegex.test(subscriptionToken);
        this.assert(isValid, `Expected ${variableName} to be a valid subscription token`);
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
