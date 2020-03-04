import { blockchainTests, constants, expect, getRandomInteger } from '@0x/contracts-test-utils';
import { AbiEncoder } from '@0x/utils';

import {
    decodeMaxGasPriceStaticCallData,
    encodeMaxGasPriceStaticCallData,
    TWENTY_GWEI,
} from '../src/max_gas_price_utils';

import { artifacts } from './artifacts';
import { MaximumGasPriceContract } from './wrappers';

blockchainTests.resets('MaximumGasPrice unit tests', env => {
    let maxGasPriceContract: MaximumGasPriceContract;
    const maxGasPriceEncoder = AbiEncoder.create([{ name: 'maxGasPrice', type: 'uint256' }]);

    before(async () => {
        maxGasPriceContract = await MaximumGasPriceContract.deployFrom0xArtifactAsync(
            artifacts.MaximumGasPrice,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('Contract functionality', () => {
        it('does not revert if tx.gasprice < default maximum', async () => {
            await maxGasPriceContract.checkGasPrice1().callAsync({ gasPrice: TWENTY_GWEI.minus(1) });
        });
        it('does not revert if tx.gasprice = default maximum', async () => {
            await maxGasPriceContract.checkGasPrice1().callAsync({ gasPrice: TWENTY_GWEI });
        });
        it('reverts if tx.gasPrice > default maximum', async () => {
            const tx = maxGasPriceContract.checkGasPrice1().callAsync({ gasPrice: TWENTY_GWEI.plus(1) });
            return expect(tx).to.revertWith('MaximumGasPrice/GAS_PRICE_EXCEEDS_20_GWEI');
        });
        it('does not revert if tx.gasprice < custom maximum', async () => {
            const maxGasPrice = getRandomInteger(0, TWENTY_GWEI.times(2));
            await maxGasPriceContract
                .checkGasPrice2(maxGasPriceEncoder.encode({ maxGasPrice }))
                .callAsync({ gasPrice: maxGasPrice.minus(1) });
        });
        it('does not revert if tx.gasprice = default maximum', async () => {
            const maxGasPrice = getRandomInteger(0, TWENTY_GWEI.times(2));
            await maxGasPriceContract
                .checkGasPrice2(maxGasPriceEncoder.encode({ maxGasPrice }))
                .callAsync({ gasPrice: maxGasPrice });
        });
        it('reverts if tx.gasPrice > default maximum', async () => {
            const maxGasPrice = getRandomInteger(0, TWENTY_GWEI.times(2));
            const tx = maxGasPriceContract
                .checkGasPrice2(maxGasPriceEncoder.encode({ maxGasPrice }))
                .callAsync({ gasPrice: maxGasPrice.plus(1) });
            return expect(tx).to.revertWith('MaximumGasPrice/GAS_PRICE_EXCEEDS_MAXIMUM');
        });
    });

    describe('Data encoding/decoding tools', () => {
        it('correctly decodes default maximum gas price', async () => {
            const encoded = encodeMaxGasPriceStaticCallData(maxGasPriceContract.address);
            const decoded = decodeMaxGasPriceStaticCallData(encoded);
            expect(decoded).to.bignumber.equal(TWENTY_GWEI);
        });
        it('correctly decodes custom maximum gas price', async () => {
            const maxGasPrice = getRandomInteger(0, constants.MAX_UINT256);
            const encoded = encodeMaxGasPriceStaticCallData(maxGasPriceContract.address, maxGasPrice);
            const decoded = decodeMaxGasPriceStaticCallData(encoded);
            expect(decoded).to.bignumber.equal(maxGasPrice);
        });
    });
});
