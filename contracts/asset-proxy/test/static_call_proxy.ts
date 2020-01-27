import {
    chaiSetup,
    constants,
    expectTransactionFailedWithoutReasonAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { AssetProxyId, RevertReason } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';

import { artifacts } from './artifacts';

import { IAssetDataContract, IAssetProxyContract, StaticCallProxyContract, TestStaticCallTargetContract } from './wrappers';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('StaticCallProxy', () => {
    const amount = constants.ZERO_AMOUNT;
    let fromAddress: string;
    let toAddress: string;

    let assetDataInterface: IAssetDataContract;
    let staticCallProxy: IAssetProxyContract;
    let staticCallTarget: TestStaticCallTargetContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [fromAddress, toAddress] = accounts.slice(0, 2);
        const staticCallProxyWithoutTransferFrom = await StaticCallProxyContract.deployFrom0xArtifactAsync(
            artifacts.StaticCallProxy,
            provider,
            txDefaults,
            artifacts,
        );
        assetDataInterface = new IAssetDataContract(constants.NULL_ADDRESS, provider);
        staticCallProxy = new IAssetProxyContract(
            staticCallProxyWithoutTransferFrom.address,
            provider,
            txDefaults,
            {},
            StaticCallProxyContract.deployedBytecode,
        );
        staticCallTarget = await TestStaticCallTargetContract.deployFrom0xArtifactAsync(
            artifacts.TestStaticCallTarget,
            provider,
            txDefaults,
            artifacts,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('general', () => {
        it('should revert if undefined function is called', async () => {
            const undefinedSelector = '0x01020304';
            await expectTransactionFailedWithoutReasonAsync(
                web3Wrapper.sendTransactionAsync({
                    from: fromAddress,
                    to: staticCallProxy.address,
                    value: constants.ZERO_AMOUNT,
                    data: undefinedSelector,
                }),
            );
        });
        it('should have an id of 0xc339d10a', async () => {
            const proxyId = await staticCallProxy.getProxyId().callAsync();
            const expectedProxyId = AssetProxyId.StaticCall;
            expect(proxyId).to.equal(expectedProxyId);
        });
    });
    describe('transferFrom', () => {
        it('should revert if assetData lies outside the bounds of calldata', async () => {
            const staticCallData = staticCallTarget.noInputFunction().getABIEncodedTransactionData();
            const expectedResultHash = constants.KECCAK256_NULL;
            const assetData = assetDataInterface
                .StaticCall(staticCallTarget.address, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData();
            const txData = staticCallProxy
                .transferFrom(assetData, fromAddress, toAddress, amount)
                .getABIEncodedTransactionData();
            const offsetToAssetData = '0000000000000000000000000000000000000000000000000000000000000080';
            const txDataEndBuffer = ethUtil.toBuffer((txData.length - 2) / 2 - 4);
            const paddedTxDataEndBuffer = ethUtil.setLengthLeft(txDataEndBuffer, 32);
            const invalidOffsetToAssetData = ethUtil.bufferToHex(paddedTxDataEndBuffer).slice(2);
            const newAssetData = '0000000000000000000000000000000000000000000000000000000000000304';
            const badTxData = `${txData.replace(offsetToAssetData, invalidOffsetToAssetData)}${newAssetData}`;
            await expectTransactionFailedWithoutReasonAsync(
                web3Wrapper.sendTransactionAsync({
                    to: staticCallProxy.address,
                    from: fromAddress,
                    data: badTxData,
                }),
            );
        });
        it('should revert if the length of assetData is less than 100 bytes', async () => {
            const staticCallData = constants.NULL_BYTES;
            const expectedResultHash = constants.KECCAK256_NULL;
            const assetData = (assetDataInterface
                .StaticCall(staticCallTarget.address, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData()).slice(0, -128);
            const assetDataByteLen = (assetData.length - 2) / 2;
            expect((assetDataByteLen - 4) % 32).to.equal(0);
            await expectTransactionFailedWithoutReasonAsync(
                staticCallProxy.transferFrom(assetData, fromAddress, toAddress, amount).sendTransactionAsync(),
            );
        });
        it('should revert if the offset to `staticCallData` points to outside of assetData', async () => {
            const staticCallData = staticCallTarget.noInputFunction().getABIEncodedTransactionData();
            const expectedResultHash = constants.KECCAK256_NULL;
            const assetData = assetDataInterface
                .StaticCall(staticCallTarget.address, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData();
            const offsetToStaticCallData = '0000000000000000000000000000000000000000000000000000000000000060';
            const assetDataEndBuffer = ethUtil.toBuffer((assetData.length - 2) / 2 - 4);
            const paddedAssetDataEndBuffer = ethUtil.setLengthLeft(assetDataEndBuffer, 32);
            const invalidOffsetToStaticCallData = ethUtil.bufferToHex(paddedAssetDataEndBuffer).slice(2);
            const newStaticCallData = '0000000000000000000000000000000000000000000000000000000000000304';
            const badAssetData = `${assetData.replace(
                offsetToStaticCallData,
                invalidOffsetToStaticCallData,
            )}${newStaticCallData}`;
            await expectTransactionFailedWithoutReasonAsync(
                staticCallProxy.transferFrom(badAssetData, fromAddress, toAddress, amount).sendTransactionAsync(),
            );
        });
        it('should revert if the callTarget attempts to write to state', async () => {
            const staticCallData = staticCallTarget.updateState().getABIEncodedTransactionData();
            const expectedResultHash = constants.KECCAK256_NULL;
            const assetData = assetDataInterface
                .StaticCall(staticCallTarget.address, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData();
            await expectTransactionFailedWithoutReasonAsync(
                staticCallProxy.transferFrom(assetData, fromAddress, toAddress, amount).sendTransactionAsync(),
            );
        });
        it('should revert with data provided by the callTarget if the staticcall reverts', async () => {
            const staticCallData = staticCallTarget.assertEvenNumber(new BigNumber(1)).getABIEncodedTransactionData();
            const expectedResultHash = constants.KECCAK256_NULL;
            const assetData = assetDataInterface
                .StaticCall(staticCallTarget.address, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData();
            return expect(
                staticCallProxy
                    .transferFrom(assetData, fromAddress, toAddress, amount)
                    .awaitTransactionSuccessAsync(),
            ).to.revertWith(RevertReason.TargetNotEven);
        });
        it('should revert if the hash of the output is different than expected expected', async () => {
            const staticCallData = staticCallTarget.isOddNumber(new BigNumber(0)).getABIEncodedTransactionData();
            const trueAsBuffer = ethUtil.toBuffer('0x0000000000000000000000000000000000000000000000000000000000000001');
            const expectedResultHash = ethUtil.bufferToHex(ethUtil.sha3(trueAsBuffer));
            const assetData = assetDataInterface
                .StaticCall(staticCallTarget.address, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData();
            return expect(
                staticCallProxy
                    .transferFrom(assetData, fromAddress, toAddress, amount)
                    .awaitTransactionSuccessAsync(),
            ).to.revertWith(RevertReason.UnexpectedStaticCallResult);
        });
        it('should be successful if a function call with no inputs and no outputs is successful', async () => {
            const staticCallData = staticCallTarget.noInputFunction().getABIEncodedTransactionData();
            const expectedResultHash = constants.KECCAK256_NULL;
            const assetData = assetDataInterface
                .StaticCall(staticCallTarget.address, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData();
            await staticCallProxy
                .transferFrom(assetData, fromAddress, toAddress, amount)
                .awaitTransactionSuccessAsync();
        });
        it('should be successful if the staticCallTarget is not a contract and no return value is expected', async () => {
            const staticCallData = '0x0102030405060708';
            const expectedResultHash = constants.KECCAK256_NULL;
            const assetData = assetDataInterface
                .StaticCall(toAddress, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData();
            await staticCallProxy
                .transferFrom(assetData, fromAddress, toAddress, amount)
                .awaitTransactionSuccessAsync();
        });
        it('should be successful if a function call with one static input returns the correct value', async () => {
            const staticCallData = staticCallTarget.isOddNumber(new BigNumber(1)).getABIEncodedTransactionData();
            const trueAsBuffer = ethUtil.toBuffer('0x0000000000000000000000000000000000000000000000000000000000000001');
            const expectedResultHash = ethUtil.bufferToHex(ethUtil.sha3(trueAsBuffer));
            const assetData = assetDataInterface
                .StaticCall(staticCallTarget.address, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData();
            await staticCallProxy
                .transferFrom(assetData, fromAddress, toAddress, amount)
                .awaitTransactionSuccessAsync();
        });
        it('should be successful if a function with one dynamic input is successful', async () => {
            const dynamicInput = '0x0102030405060708';
            const staticCallData = staticCallTarget.dynamicInputFunction(dynamicInput).getABIEncodedTransactionData();
            const expectedResultHash = constants.KECCAK256_NULL;
            const assetData = assetDataInterface
                .StaticCall(staticCallTarget.address, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData();
            await staticCallProxy
                .transferFrom(assetData, fromAddress, toAddress, amount)
                .awaitTransactionSuccessAsync();
        });
        it('should be successful if a function call returns a complex type', async () => {
            const a = new BigNumber(1);
            const b = new BigNumber(2);
            const staticCallData = staticCallTarget.returnComplexType(a, b).getABIEncodedTransactionData();
            const abiEncoder = new AbiEncoder.DynamicBytes({
                name: '',
                type: 'bytes',
            });
            const aHex = '0000000000000000000000000000000000000000000000000000000000000001';
            const bHex = '0000000000000000000000000000000000000000000000000000000000000002';
            const expectedResults = `${staticCallTarget.address}${aHex}${bHex}`;
            const offset = '0000000000000000000000000000000000000000000000000000000000000020';
            const encodedExpectedResultWithOffset = `0x${offset}${abiEncoder.encode(expectedResults).slice(2)}`;
            const expectedResultHash = ethUtil.bufferToHex(
                ethUtil.sha3(ethUtil.toBuffer(encodedExpectedResultWithOffset)),
            );
            const assetData = assetDataInterface
                .StaticCall(staticCallTarget.address, staticCallData, expectedResultHash)
                .getABIEncodedTransactionData();
            await staticCallProxy
                .transferFrom(assetData, fromAddress, toAddress, amount)
                .awaitTransactionSuccessAsync();
        });
    });
});
