import { addressUtils, blockchainTests, expect, hexRandom, OrderStatus, orderUtils } from '@0x/contracts-test-utils';
import { ExchangeRevertErrors, generatePseudoRandomSalt } from '@0x/order-utils';
import { RevertError } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, TestLibExchangeRichErrorDecoderContract } from '../src';

blockchainTests.resets('LibExchangeRichErrorDecoder', ({ provider, txDefaults }) => {
    const SIGNATURE_LENGTH = 66;
    const ASSET_DATA_LENGTH = 36;
    const ERROR_DATA_LENGTH = 100;
    let decoder: TestLibExchangeRichErrorDecoderContract;

    before(async () => {
        decoder = await TestLibExchangeRichErrorDecoderContract.deployFrom0xArtifactAsync(
            artifacts.TestLibExchangeRichErrorDecoder,
            provider,
            txDefaults,
        );
    });

    function createDecodeTest(revertType: new (...args: any[]) => RevertError, parameters: any[]): void {
        const revert = new revertType(...parameters);
        const encoded = revert.encode();
        // Exploit the fact that `RevertError` types have the same names as their
        // Solidity counterparts.
        const endpointName = `decode${revert.name}`;
        const callAsync = (_encoded: string) => {
            return (decoder as any)[endpointName].callAsync.call((decoder as any)[endpointName], _encoded);
        };
        describe(`${endpointName}()`, async () => {
            it('decodes encoded parameters', async () => {
                let results = await callAsync(encoded);
                if (!_.isArray(results)) {
                    results = [results];
                }
                return expect(results).to.deep.equal(parameters);
            });
            it('reverts if selector does not match', async () => {
                // Replace the selector with null bytes.
                const NULL_SELECTOR = '00000000';
                const withBadSelector = `0x${NULL_SELECTOR}${encoded.substr(10)}`;
                return expect(callAsync(withBadSelector)).to.revertWith('BAD_SELECTOR');
            });
        });
    }

    (() => {
        const errorCode = ExchangeRevertErrors.SignatureErrorCode.Illegal;
        const orderHash = orderUtils.generatePseudoRandomOrderHash();
        const signer = addressUtils.generatePseudoRandomAddress();
        const validator = addressUtils.generatePseudoRandomAddress();
        const signature = hexRandom(SIGNATURE_LENGTH);
        const errorData = hexRandom(ERROR_DATA_LENGTH);
        createDecodeTest(ExchangeRevertErrors.SignatureError, [errorCode, orderHash, signer, signature]);
        createDecodeTest(ExchangeRevertErrors.SignatureValidatorNotApprovedError, [signer, validator]);
        createDecodeTest(ExchangeRevertErrors.SignatureValidatorError, [
            orderHash,
            signer,
            validator,
            signature,
            errorData,
        ]);
        createDecodeTest(ExchangeRevertErrors.SignatureWalletError, [orderHash, signer, signature, errorData]);
    })();

    (() => {
        const orderHash = orderUtils.generatePseudoRandomOrderHash();
        const orderStatus = OrderStatus.FullyFilled;
        createDecodeTest(ExchangeRevertErrors.OrderStatusError, [orderHash, orderStatus]);
    })();

    (() => {
        const orderHash = orderUtils.generatePseudoRandomOrderHash();
        const address = addressUtils.generatePseudoRandomAddress();
        createDecodeTest(ExchangeRevertErrors.InvalidSenderError, [orderHash, address]);
        createDecodeTest(ExchangeRevertErrors.InvalidMakerError, [orderHash, address]);
        createDecodeTest(ExchangeRevertErrors.InvalidTakerError, [orderHash, address]);
    })();

    (() => {
        const errorCode = ExchangeRevertErrors.FillErrorCode.TakerOverpay;
        const orderHash = orderUtils.generatePseudoRandomOrderHash();
        createDecodeTest(ExchangeRevertErrors.FillError, [errorCode, orderHash]);
    })();

    (() => {
        const maker = addressUtils.generatePseudoRandomAddress();
        const sender = addressUtils.generatePseudoRandomAddress();
        const currentEpoch = generatePseudoRandomSalt();
        createDecodeTest(ExchangeRevertErrors.OrderEpochError, [maker, sender, currentEpoch]);
    })();

    (() => {
        const assetProxyAddress = addressUtils.generatePseudoRandomAddress();
        createDecodeTest(ExchangeRevertErrors.AssetProxyExistsError, [assetProxyAddress]);
    })();

    (() => {
        const errorCode = ExchangeRevertErrors.AssetProxyDispatchErrorCode.UnknownAssetProxy;
        const orderHash = orderUtils.generatePseudoRandomOrderHash();
        const assetData = hexRandom(ASSET_DATA_LENGTH);
        createDecodeTest(ExchangeRevertErrors.AssetProxyDispatchError, [errorCode, orderHash, assetData]);
    })();

    (() => {
        const orderHash = orderUtils.generatePseudoRandomOrderHash();
        const assetData = hexRandom(ASSET_DATA_LENGTH);
        const errorData = hexRandom(ERROR_DATA_LENGTH);
        createDecodeTest(ExchangeRevertErrors.AssetProxyTransferError, [orderHash, assetData, errorData]);
    })();

    (() => {
        const leftOrderHash = orderUtils.generatePseudoRandomOrderHash();
        const rightOrderHash = orderUtils.generatePseudoRandomOrderHash();
        createDecodeTest(ExchangeRevertErrors.NegativeSpreadError, [leftOrderHash, rightOrderHash]);
    })();

    (() => {
        const errorCode = ExchangeRevertErrors.TransactionErrorCode.AlreadyExecuted;
        const transactionHash = orderUtils.generatePseudoRandomOrderHash();
        createDecodeTest(ExchangeRevertErrors.TransactionError, [errorCode, transactionHash]);
    })();

    (() => {
        const transactionHash = orderUtils.generatePseudoRandomOrderHash();
        const signer = addressUtils.generatePseudoRandomAddress();
        const signature = hexRandom(SIGNATURE_LENGTH);
        createDecodeTest(ExchangeRevertErrors.TransactionSignatureError, [transactionHash, signer, signature]);
    })();

    (() => {
        const transactionHash = orderUtils.generatePseudoRandomOrderHash();
        const errorData = hexRandom(ERROR_DATA_LENGTH);
        createDecodeTest(ExchangeRevertErrors.TransactionExecutionError, [transactionHash, errorData]);
    })();

    (() => {
        const orderHash = orderUtils.generatePseudoRandomOrderHash();
        createDecodeTest(ExchangeRevertErrors.IncompleteFillError, [orderHash]);
    })();
});
