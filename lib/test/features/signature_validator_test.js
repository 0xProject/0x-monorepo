"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const order_utils_1 = require("@0x/order-utils");
const types_1 = require("@0x/types");
const utils_1 = require("@0x/utils");
const ethjs = require("ethereumjs-util");
const _ = require("lodash");
const wrappers_1 = require("../../src/wrappers");
const abis_1 = require("../utils/abis");
const migration_1 = require("../utils/migration");
const { NULL_BYTES } = contracts_test_utils_1.constants;
contracts_test_utils_1.blockchainTests.resets('SignatureValidator feature', env => {
    let owner;
    let signers;
    let zeroEx;
    let feature;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner, ...signers] = yield env.getAccountAddressesAsync();
        zeroEx = yield migration_1.fullMigrateAsync(owner, env.provider, env.txDefaults);
        feature = new wrappers_1.SignatureValidatorFeatureContract(zeroEx.address, env.provider, env.txDefaults, abis_1.abis);
    }));
    describe('validateHashSignature()', () => {
        it('can validate an eth_sign signature', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = yield order_utils_1.signatureUtils.ecSignHashAsync(env.provider, hash, signer);
            yield feature.validateHashSignature(hash, signer, signature).callAsync();
        }));
        it('rejects a wrong eth_sign signature', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = yield order_utils_1.signatureUtils.ecSignHashAsync(env.provider, hash, signer);
            const notSigner = contracts_test_utils_1.randomAddress();
            const tx = feature.validateHashSignature(hash, notSigner, signature).callAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.WrongSigner, hash, notSigner, signature));
        }));
        it('rejects an eth_sign if ecrecover() fails', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = utils_1.hexUtils.concat(utils_1.hexUtils.random(65), types_1.SignatureType.EthSign);
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.WrongSigner, hash, signer, signature));
        }));
        it('rejects a too short eth_sign signature', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = utils_1.hexUtils.slice(yield order_utils_1.signatureUtils.ecSignHashAsync(env.provider, hash, signer), 1);
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.InvalidLength, hash, signer, signature));
        }));
        it('can validate an eip712 signature', () => __awaiter(this, void 0, void 0, function* () {
            const privateKey = utils_1.hexUtils.random();
            const signer = utils_1.hexUtils.toHex(ethjs.privateToAddress(ethjs.toBuffer(privateKey)));
            const hash = utils_1.hexUtils.random();
            const signature = utils_1.hexUtils.toHex(contracts_test_utils_1.signingUtils.signMessage(ethjs.toBuffer(hash), ethjs.toBuffer(privateKey), types_1.SignatureType.EIP712));
            yield feature.validateHashSignature(hash, signer, signature).callAsync();
        }));
        it('rejects a wrong eip712 signature', () => __awaiter(this, void 0, void 0, function* () {
            const privateKey = utils_1.hexUtils.random();
            const hash = utils_1.hexUtils.random();
            const signature = utils_1.hexUtils.toHex(contracts_test_utils_1.signingUtils.signMessage(ethjs.toBuffer(hash), ethjs.toBuffer(privateKey), types_1.SignatureType.EIP712));
            const notSigner = contracts_test_utils_1.randomAddress();
            const tx = feature.validateHashSignature(hash, notSigner, signature).callAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.WrongSigner, hash, notSigner, signature));
        }));
        it('rejects an eip712 if ecrecover() fails', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = utils_1.hexUtils.concat(utils_1.hexUtils.random(65), types_1.SignatureType.EIP712);
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.WrongSigner, hash, signer, signature));
        }));
        it('rejects a too short eip712 signature', () => __awaiter(this, void 0, void 0, function* () {
            const privateKey = utils_1.hexUtils.random();
            const signer = utils_1.hexUtils.toHex(ethjs.privateToAddress(ethjs.toBuffer(privateKey)));
            const hash = utils_1.hexUtils.random();
            const signature = utils_1.hexUtils.slice(utils_1.hexUtils.toHex(contracts_test_utils_1.signingUtils.signMessage(ethjs.toBuffer(hash), ethjs.toBuffer(privateKey), types_1.SignatureType.EIP712)), 1);
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.InvalidLength, hash, signer, signature));
        }));
        it('rejects an INVALID signature type', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = utils_1.hexUtils.concat(utils_1.hexUtils.slice(yield order_utils_1.signatureUtils.ecSignHashAsync(env.provider, hash, signer), 0, -1), types_1.SignatureType.Invalid);
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.AlwaysInvalid, hash, signer, signature));
        }));
        it('rejects an ILLEGAL signature type', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = utils_1.hexUtils.concat(utils_1.hexUtils.slice(yield order_utils_1.signatureUtils.ecSignHashAsync(env.provider, hash, signer), 0, -1), types_1.SignatureType.Illegal);
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.Illegal, hash, signer, signature));
        }));
        it('rejects an unsupported signature type', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = utils_1.hexUtils.concat(utils_1.hexUtils.slice(yield order_utils_1.signatureUtils.ecSignHashAsync(env.provider, hash, signer), 0, -1), types_1.SignatureType.Wallet);
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.Unsupported, hash, signer, signature));
        }));
        it('rejects an empty signature type', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = NULL_BYTES;
            const tx = feature.validateHashSignature(hash, signer, signature).callAsync();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.InvalidLength, hash, signer, signature));
        }));
    });
    describe('isValidHashSignature()', () => {
        it('returns true on valid signature', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = yield order_utils_1.signatureUtils.ecSignHashAsync(env.provider, hash, signer);
            const r = yield feature.isValidHashSignature(hash, signer, signature).callAsync();
            contracts_test_utils_1.expect(r).to.eq(true);
        }));
        it('returns false on invalid signature', () => __awaiter(this, void 0, void 0, function* () {
            const hash = utils_1.hexUtils.random();
            const signer = _.sampleSize(signers, 1)[0];
            const signature = yield order_utils_1.signatureUtils.ecSignHashAsync(env.provider, hash, signer);
            const r = yield feature.isValidHashSignature(hash, contracts_test_utils_1.randomAddress(), signature).callAsync();
            contracts_test_utils_1.expect(r).to.eq(false);
        }));
    });
});
//# sourceMappingURL=signature_validator_test.js.map