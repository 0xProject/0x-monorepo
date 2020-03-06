import { artifacts as assetProxyArtifacts, StaticCallProxyContract } from '@0x/contracts-asset-proxy';
import { blockchainTests, constants, expect, getRandomInteger, randomAddress } from '@0x/contracts-test-utils';

import {
    decodeMaxGasPriceStaticCallData,
    encodeMaxGasPriceStaticCallData,
    TWENTY_GWEI,
} from '../src/max_gas_price_utils';

import { artifacts } from './artifacts';
import { MaximumGasPriceContract } from './wrappers';

blockchainTests.resets('MaximumGasPrice unit tests', env => {
    let maxGasPriceContract: MaximumGasPriceContract;
    let staticCallProxy: StaticCallProxyContract;

    let defaultMaxAssetData: string;

    before(async () => {
        maxGasPriceContract = await MaximumGasPriceContract.deployFrom0xArtifactAsync(
            artifacts.MaximumGasPrice,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        staticCallProxy = await StaticCallProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.StaticCallProxy,
            env.provider,
            env.txDefaults,
            assetProxyArtifacts,
        );

        defaultMaxAssetData = encodeMaxGasPriceStaticCallData(maxGasPriceContract.address);
    });

    describe('Data encoding/decoding tools', () => {
        it('correctly decodes default maximum gas price', async () => {
            const decoded = decodeMaxGasPriceStaticCallData(defaultMaxAssetData);
            expect(decoded).to.bignumber.equal(TWENTY_GWEI);
        });
        it('correctly decodes custom maximum gas price', async () => {
            const customMaxGasPrice = getRandomInteger(0, constants.MAX_UINT256);
            const customMaxAssetData = encodeMaxGasPriceStaticCallData(maxGasPriceContract.address, customMaxGasPrice);
            const decoded = decodeMaxGasPriceStaticCallData(customMaxAssetData);
            expect(decoded).to.bignumber.equal(customMaxGasPrice);
        });
    });

    describe('Contract functionality', () => {
        it('does not revert if tx.gasprice < default maximum', async () => {
            await staticCallProxy
                .transferFrom(defaultMaxAssetData, randomAddress(), randomAddress(), constants.ZERO_AMOUNT)
                .callAsync({ gasPrice: TWENTY_GWEI.minus(1) });
        });
        it('does not revert if tx.gasprice = default maximum', async () => {
            await staticCallProxy
                .transferFrom(defaultMaxAssetData, randomAddress(), randomAddress(), constants.ZERO_AMOUNT)
                .callAsync({ gasPrice: TWENTY_GWEI });
        });
        it('reverts if tx.gasPrice > default maximum', async () => {
            const tx = staticCallProxy
                .transferFrom(defaultMaxAssetData, randomAddress(), randomAddress(), constants.ZERO_AMOUNT)
                .callAsync({ gasPrice: TWENTY_GWEI.plus(1) });
            return expect(tx).to.revertWith('MaximumGasPrice/GAS_PRICE_EXCEEDS_20_GWEI');
        });
        it('does not revert if tx.gasprice < custom maximum', async () => {
            const maxGasPrice = getRandomInteger(0, TWENTY_GWEI.times(2));
            const customMaxAssetData = encodeMaxGasPriceStaticCallData(maxGasPriceContract.address, maxGasPrice);
            await staticCallProxy
                .transferFrom(customMaxAssetData, randomAddress(), randomAddress(), constants.ZERO_AMOUNT)
                .callAsync({ gasPrice: maxGasPrice.minus(1) });
        });
        it('does not revert if tx.gasprice = custom maximum', async () => {
            const maxGasPrice = getRandomInteger(0, TWENTY_GWEI.times(2));
            const customMaxAssetData = encodeMaxGasPriceStaticCallData(maxGasPriceContract.address, maxGasPrice);
            await staticCallProxy
                .transferFrom(customMaxAssetData, randomAddress(), randomAddress(), constants.ZERO_AMOUNT)
                .callAsync({ gasPrice: maxGasPrice });
        });
        it('reverts if tx.gasPrice > custom maximum', async () => {
            const maxGasPrice = getRandomInteger(0, TWENTY_GWEI.times(2));
            const customMaxAssetData = encodeMaxGasPriceStaticCallData(maxGasPriceContract.address, maxGasPrice);
            const tx = staticCallProxy
                .transferFrom(customMaxAssetData, randomAddress(), randomAddress(), constants.ZERO_AMOUNT)
                .callAsync({ gasPrice: maxGasPrice.plus(1) });
            return expect(tx).to.revertWith('MaximumGasPrice/GAS_PRICE_EXCEEDS_MAXIMUM');
        });
    });
});
