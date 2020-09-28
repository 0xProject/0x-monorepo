import { blockchainTests, constants, expect, randomAddress, signingUtils } from '@0x/contracts-test-utils';
import { signatureUtils } from '@0x/order-utils';
import { SignatureType } from '@0x/types';
import { hexUtils, ZeroExRevertErrors } from '@0x/utils';
import * as ethjs from 'ethereumjs-util';
import * as _ from 'lodash';

import { IZeroExContract, SignatureValidatorFeatureContract } from '../../src/wrappers';
import { abis } from '../utils/abis';
import { fullMigrateAsync } from '../utils/migration';

const { NULL_BYTES } = constants;

blockchainTests.resets('SignatureValidator feature', env => {
    let owner: string;
    let signers: string[];
    let zeroEx: IZeroExContract;
    let feature: SignatureValidatorFeatureContract;

    before(async () => {
        [owner, ...signers] = await env.getAccountAddressesAsync();
        zeroEx = await fullMigrateAsync(owner, env.provider, env.txDefaults);
        feature = new SignatureValidatorFeatureContract(zeroEx.address, env.provider, env.txDefaults, abis);
    });

    describe('validateHashSignature()', () => {
        it('can validate an eth_sign signature', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = await signatureUtils.ecSignHashAsync(env.provider, hash, signer);
            await feature.validateHashSignature(hash, signer, signature).callAsync();
        });

        it('rejects a wrong eth_sign signature', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = await signatureUtils.ecSignHashAsync(env.provider, hash, signer);
            const notSigner = randomAddress();
            const tx = feature.validateHashSignature(hash, notSigner, signature).callAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                    ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.WrongSigner,
                    hash,
                    notSigner,
                    signature,
                ),
            );
        });

        it('rejects an eth_sign if ecrecover() fails', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = hexUtils.concat(hexUtils.random(65), SignatureType.EthSign);
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                    ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.WrongSigner,
                    hash,
                    signer,
                    signature,
                ),
            );
        });

        it('rejects a too short eth_sign signature', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = hexUtils.slice(await signatureUtils.ecSignHashAsync(env.provider, hash, signer), 1);
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                    ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.InvalidLength,
                    hash,
                    signer,
                    signature,
                ),
            );
        });

        it('can validate an eip712 signature', async () => {
            const privateKey = hexUtils.random();
            const signer = hexUtils.toHex(ethjs.privateToAddress(ethjs.toBuffer(privateKey)));
            const hash = hexUtils.random();
            const signature = hexUtils.toHex(
                signingUtils.signMessage(ethjs.toBuffer(hash), ethjs.toBuffer(privateKey), SignatureType.EIP712),
            );
            await feature.validateHashSignature(hash, signer, signature).callAsync();
        });

        it('rejects a wrong eip712 signature', async () => {
            const privateKey = hexUtils.random();
            const hash = hexUtils.random();
            const signature = hexUtils.toHex(
                signingUtils.signMessage(ethjs.toBuffer(hash), ethjs.toBuffer(privateKey), SignatureType.EIP712),
            );
            const notSigner = randomAddress();
            const tx = feature.validateHashSignature(hash, notSigner, signature).callAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                    ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.WrongSigner,
                    hash,
                    notSigner,
                    signature,
                ),
            );
        });

        it('rejects an eip712 if ecrecover() fails', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = hexUtils.concat(hexUtils.random(65), SignatureType.EIP712);
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                    ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.WrongSigner,
                    hash,
                    signer,
                    signature,
                ),
            );
        });

        it('rejects a too short eip712 signature', async () => {
            const privateKey = hexUtils.random();
            const signer = hexUtils.toHex(ethjs.privateToAddress(ethjs.toBuffer(privateKey)));
            const hash = hexUtils.random();
            const signature = hexUtils.slice(
                hexUtils.toHex(
                    signingUtils.signMessage(ethjs.toBuffer(hash), ethjs.toBuffer(privateKey), SignatureType.EIP712),
                ),
                1,
            );
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                    ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.InvalidLength,
                    hash,
                    signer,
                    signature,
                ),
            );
        });

        it('rejects an INVALID signature type', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = hexUtils.concat(
                hexUtils.slice(await signatureUtils.ecSignHashAsync(env.provider, hash, signer), 0, -1),
                SignatureType.Invalid,
            );
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                    ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.AlwaysInvalid,
                    hash,
                    signer,
                    signature,
                ),
            );
        });

        it('rejects an ILLEGAL signature type', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = hexUtils.concat(
                hexUtils.slice(await signatureUtils.ecSignHashAsync(env.provider, hash, signer), 0, -1),
                SignatureType.Illegal,
            );
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                    ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.Illegal,
                    hash,
                    signer,
                    signature,
                ),
            );
        });

        it('rejects an unsupported signature type', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = hexUtils.concat(
                hexUtils.slice(await signatureUtils.ecSignHashAsync(env.provider, hash, signer), 0, -1),
                SignatureType.Wallet,
            );
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                    ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.Unsupported,
                    hash,
                    signer,
                    signature,
                ),
            );
        });

        it('rejects an empty signature type', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = NULL_BYTES;
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                    ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.InvalidLength,
                    hash,
                    signer,
                    signature,
                ),
            );
        });
    });

    describe('isValidHashSignature()', () => {
        it('returns true on valid signature', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = await signatureUtils.ecSignHashAsync(env.provider, hash, signer);
            const r = await feature.isValidHashSignature(hash, signer, signature).callAsync();
            expect(r).to.eq(true);
        });

        it('returns false on invalid signature', async () => {
            const hash = hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = await signatureUtils.ecSignHashAsync(env.provider, hash, signer);
            const r = await feature.isValidHashSignature(hash, randomAddress(), signature).callAsync();
            expect(r).to.eq(false);
        });
    });
});
