import {
    addressUtils,
    chaiSetup,
    OrderStatus,
    orderUtils,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, ExchangeRevertErrors, orderHashUtils } from '@0x/order-utils';
import { RevertError } from '@0x/utils';
import * as chai from 'chai';
import * as crypto from 'crypto';
import * as _ from 'lodash';

import {
    artifacts,
    TestLibExchangeRichErrorDecoderContract,
} from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe.only('LibExchangeRichErrorDecoder', () => {
    let decoder: TestLibExchangeRichErrorDecoderContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        decoder = await TestLibExchangeRichErrorDecoderContract.deployFrom0xArtifactAsync(
            artifacts.TestLibExchangeRichErrorDecoder,
            provider,
            txDefaults,
        );
    });

    function generateRandomBytes(length: number) {
        const bytes = crypto.randomBytes(length).toString('hex');
        return `0x${bytes}`;
    }

    function createDecodeTest(
        revertType: new(...args: any[]) => RevertError,
        parameters: any[],
    ) {
        const revert = new revertType(...parameters);
        const encoded = revert.encode();
        const endpointName = `decode${revert.name}`;
        const callAsync = (encoded: string) => {
             return (decoder as any)[endpointName].callAsync.call(
                 (decoder as any)[endpointName],
                 encoded,
             );
        };
        describe(`${endpointName}()`, async () => {
            it('decodes encoded parameters', async () => {
                const results = await callAsync(encoded);
                return expect(results).to.deep.equal(parameters);
            });
            it('reverts if selector does not match', async () => {
                // Replace the selector with null bytes.
                const NULL_SELECTOR = '00000000';
                const withBadSelector = `0x${NULL_SELECTOR}${encoded.substr(10)}`;
                return expect(callAsync(withBadSelector)).to.revertWith('BAD_SELECTOR');
            });
        });
    };

    (() => {
        const errorCode = ExchangeRevertErrors.SignatureErrorCode.Illegal;
        const orderHash = orderUtils.generatePseudoRandomOrderHash();
        const signer = addressUtils.generatePseudoRandomAddress();
        const signature = generateRandomBytes(66);
        const errorData = generateRandomBytes(4+32+32+32);
        createDecodeTest(
            ExchangeRevertErrors.SignatureError,
            [
                errorCode,
                orderHash,
                signer,
                signature,
            ],
        );
        createDecodeTest(
            ExchangeRevertErrors.SignatureValidatorError,
            [
                orderHash,
                signer,
                signature,
                errorData,
            ],
        );
        createDecodeTest(
            ExchangeRevertErrors.SignatureWalletError,
            [
                orderHash,
                signer,
                signature,
                errorData,
            ],
        );
        createDecodeTest(
            ExchangeRevertErrors.SignatureOrderValidatorError,
            [
                orderHash,
                signer,
                signature,
                errorData,
            ],
        );
        createDecodeTest(
            ExchangeRevertErrors.SignatureWalletOrderValidatorError,
            [
                orderHash,
                signer,
                signature,
                errorData,
            ],
        );
    })();
});
