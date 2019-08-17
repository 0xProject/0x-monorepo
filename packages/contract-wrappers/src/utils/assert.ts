import { assert as sharedAssert } from '@0x/assert';
// HACK: We need those two unused imports because they're actually used by sharedAssert which gets injected here
import { Schema } from '@0x/json-schemas'; // tslint:disable-line:no-unused-variable
import { assetDataUtils, signatureUtils } from '@0x/order-utils';
import { Order } from '@0x/types'; // tslint:disable-line:no-unused-variable
import { BigNumber } from '@0x/utils'; // tslint:disable-line:no-unused-variable
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider } from 'ethereum-types';
import * as _ from 'lodash';

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

export const assert = {
    ...sharedAssert,
    async isValidSignatureAsync(
        supportedProvider: SupportedProvider,
        orderHash: string,
        signature: string,
        signerAddress: string,
    ): Promise<void> {
        const isValid = await signatureUtils.isValidSignatureAsync(
            supportedProvider,
            orderHash,
            signature,
            signerAddress,
        );
        sharedAssert.assert(isValid, `Expected order with hash '${orderHash}' to have a valid signature`);
    },
    isValidSubscriptionToken(variableName: string, subscriptionToken: string): void {
        const uuidRegex = new RegExp('^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$');
        const isValid = uuidRegex.test(subscriptionToken);
        sharedAssert.assert(isValid, `Expected ${variableName} to be a valid subscription token`);
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
    ordersCanBeUsedForForwarderContract(orders: Order[], etherTokenAddress: string): void {
        sharedAssert.assert(!_.isEmpty(orders), 'Expected at least 1 signed order. Found no orders');
        assert.ordersHaveAtMostOneUniqueValueForProperty(orders, 'makerAssetData');
        assert.allTakerAssetDatasAreErc20Token(orders, etherTokenAddress);
        assert.allTakerAddressesAreNull(orders);
    },
    feeOrdersCanBeUsedForForwarderContract(orders: Order[], zrxTokenAddress: string, etherTokenAddress: string): void {
        if (!_.isEmpty(orders)) {
            assert.allMakerAssetDatasAreErc20Token(orders, zrxTokenAddress);
            assert.allTakerAssetDatasAreErc20Token(orders, etherTokenAddress);
        }
    },
    allTakerAddressesAreNull(orders: Order[]): void {
        assert.ordersHaveAtMostOneUniqueValueForProperty(orders, 'takerAddress', NULL_ADDRESS);
    },
    allMakerAssetDatasAreErc20Token(orders: Order[], tokenAddress: string): void {
        assert.ordersHaveAtMostOneUniqueValueForProperty(
            orders,
            'makerAssetData',
            assetDataUtils.encodeERC20AssetData(tokenAddress),
        );
    },
    allTakerAssetDatasAreErc20Token(orders: Order[], tokenAddress: string): void {
        assert.ordersHaveAtMostOneUniqueValueForProperty(
            orders,
            'takerAssetData',
            assetDataUtils.encodeERC20AssetData(tokenAddress),
        );
    },
    /*
     * Asserts that all the orders have the same value for the provided propertyName
     * If the value parameter is provided, this asserts that all orders have the prope
     */
    ordersHaveAtMostOneUniqueValueForProperty(orders: Order[], propertyName: string, value?: any): void {
        const allValues = _.map(orders, order => _.get(order, propertyName));
        sharedAssert.hasAtMostOneUniqueValue(
            allValues,
            `Expected all orders to have the same ${propertyName} field. Found the following ${propertyName} values: ${JSON.stringify(
                allValues,
            )}`,
        );
        if (value !== undefined) {
            const firstValue = _.head(allValues);
            sharedAssert.assert(
                firstValue === value,
                `Expected all orders to have a ${propertyName} field with value: ${value}. Found: ${firstValue}`,
            );
        }
    },
};
