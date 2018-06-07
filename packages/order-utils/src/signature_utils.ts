import { schemas } from '@0xproject/json-schemas';
import { ECSignature, SignatureType, ValidatorSignature } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { assert } from './assert';
import { ExchangeContract } from './generated_contract_wrappers/exchange';
import { IValidatorContract } from './generated_contract_wrappers/i_validator';
import { IWalletContract } from './generated_contract_wrappers/i_wallet';
import { MessagePrefixOpts, MessagePrefixType, OrderError } from './types';
import { utils } from './utils';

/**
 * Verifies that the provided signature is valid according to the 0x Protocol smart contracts
 * @param   data          The hex encoded data signed by the supplied signature.
 * @param   signature     A hex encoded 0x Protocol signature made up of: [TypeSpecificData][SignatureType].
 *          E.g [vrs][SignatureType.EIP712]
 * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
 * @return  Whether the signature is valid for the supplied signerAddress and data.
 */
export async function isValidSignatureAsync(
    provider: Provider,
    data: string,
    signature: string,
    signerAddress: string,
): Promise<boolean> {
    const signatureTypeIndexIfExists = utils.getSignatureTypeIndexIfExists(signature);
    if (_.isUndefined(signatureTypeIndexIfExists)) {
        throw new Error(`Unrecognized signatureType in signature: ${signature}`);
    }

    switch (signatureTypeIndexIfExists) {
        case SignatureType.Illegal:
        case SignatureType.Invalid:
            return false;

        case SignatureType.EIP712: {
            const ecSignature = parseECSignature(signature);
            return isValidECSignature(data, ecSignature, signerAddress);
        }

        case SignatureType.EthSign: {
            const ecSignature = parseECSignature(signature);
            const prefixedMessageHex = addSignedMessagePrefix(data, MessagePrefixType.EthSign);
            return isValidECSignature(prefixedMessageHex, ecSignature, signerAddress);
        }

        case SignatureType.Caller:
            // HACK: We currently do not "validate" the caller signature type.
            // It can only be validated during Exchange contract execution.
            throw new Error('Caller signature type cannot be validated off-chain');

        case SignatureType.Wallet: {
            const isValid = await isValidWalletSignatureAsync(provider, data, signature, signerAddress);
            return isValid;
        }

        case SignatureType.Validator: {
            const isValid = await isValidValidatorSignatureAsync(provider, data, signature, signerAddress);
            return isValid;
        }

        case SignatureType.PreSigned: {
            return isValidPresignedSignatureAsync(provider, data, signerAddress);
        }

        case SignatureType.Trezor: {
            const prefixedMessageHex = addSignedMessagePrefix(data, MessagePrefixType.Trezor);
            const ecSignature = parseECSignature(signature);
            return isValidECSignature(prefixedMessageHex, ecSignature, signerAddress);
        }

        default:
            throw new Error(`Unhandled SignatureType: ${signatureTypeIndexIfExists}`);
    }
}

/**
 * Verifies that the provided presigned signature is valid according to the 0x Protocol smart contracts
 * @param   data          The hex encoded data signed by the supplied signature.
 * @param   signature     A hex encoded presigned 0x Protocol signature made up of: [SignatureType.Presigned]
 * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
 * @return  Whether the data was preSigned by the supplied signerAddress.
 */
export async function isValidPresignedSignatureAsync(
    provider: Provider,
    data: string,
    signerAddress: string,
): Promise<boolean> {
    const exchangeContract = new ExchangeContract(artifacts.Exchange.abi, signerAddress, provider);
    const isValid = await exchangeContract.preSigned.callAsync(data, signerAddress);
    return isValid;
}

/**
 * Verifies that the provided wallet signature is valid according to the 0x Protocol smart contracts
 * @param   data          The hex encoded data signed by the supplied signature.
 * @param   signature     A hex encoded presigned 0x Protocol signature made up of: [SignatureType.Presigned]
 * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
 * @return  Whether the data was preSigned by the supplied signerAddress.
 */
export async function isValidWalletSignatureAsync(
    provider: Provider,
    data: string,
    signature: string,
    signerAddress: string,
): Promise<boolean> {
    // tslint:disable-next-line:custom-no-magic-numbers
    const signatureWithoutType = signature.slice(-2);
    const walletContract = new IWalletContract(artifacts.IWallet.abi, signerAddress, provider);
    const isValid = await walletContract.isValidSignature.callAsync(data, signatureWithoutType);
    return isValid;
}

/**
 * Verifies that the provided validator signature is valid according to the 0x Protocol smart contracts
 * @param   data          The hex encoded data signed by the supplied signature.
 * @param   signature     A hex encoded presigned 0x Protocol signature made up of: [SignatureType.Presigned]
 * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
 * @return  Whether the data was preSigned by the supplied signerAddress.
 */
export async function isValidValidatorSignatureAsync(
    provider: Provider,
    data: string,
    signature: string,
    signerAddress: string,
): Promise<boolean> {
    const validatorSignature = parseValidatorSignature(signature);
    const exchangeContract = new ExchangeContract(artifacts.Exchange.abi, signerAddress, provider);
    const isValidatorApproved = await exchangeContract.allowedValidators.callAsync(
        signerAddress,
        validatorSignature.validatorAddress,
    );
    if (!isValidatorApproved) {
        throw new Error(`Validator ${validatorSignature.validatorAddress} was not pre-approved by ${signerAddress}.`);
    }

    const validatorContract = new IValidatorContract(artifacts.IValidator.abi, signerAddress, provider);
    const isValid = await validatorContract.isValidSignature.callAsync(
        data,
        signerAddress,
        validatorSignature.signature,
    );
    return isValid;
}

/**
 * Checks if the supplied elliptic curve signature corresponds to signing `data` with
 * the private key corresponding to `signerAddress`
 * @param   data          The hex encoded data signed by the supplied signature.
 * @param   signature     An object containing the elliptic curve signature parameters.
 * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
 * @return Whether the ECSignature is valid.
 */
export function isValidECSignature(data: string, signature: ECSignature, signerAddress: string): boolean {
    assert.isHexString('data', data);
    assert.doesConformToSchema('signature', signature, schemas.ecSignatureSchema);
    assert.isETHAddressHex('signerAddress', signerAddress);

    const msgHashBuff = ethUtil.toBuffer(data);
    try {
        const pubKey = ethUtil.ecrecover(
            msgHashBuff,
            signature.v,
            ethUtil.toBuffer(signature.r),
            ethUtil.toBuffer(signature.s),
        );
        const retrievedAddress = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
        return retrievedAddress === signerAddress;
    } catch (err) {
        return false;
    }
}

/**
 * Signs an orderHash and returns it's elliptic curve signature.
 * This method currently supports TestRPC, Geth and Parity above and below V1.6.6
 * @param   orderHash       Hex encoded orderHash to sign.
 * @param   signerAddress   The hex encoded Ethereum address you wish to sign it with. This address
 *          must be available via the Provider supplied to 0x.js.
 * @param   hashPrefixOpts Different signers add/require different prefixes be appended to the message being signed.
 *          Since we cannot know ahead of time which signer you are using, you must supply both a prefixType and
 *          whether it must be added before calling `eth_sign` (some signers add it themselves)
 * @return  An object containing the Elliptic curve signature parameters generated by signing the orderHash.
 */
export async function ecSignOrderHashAsync(
    provider: Provider,
    orderHash: string,
    signerAddress: string,
    messagePrefixOpts: MessagePrefixOpts,
): Promise<ECSignature> {
    assert.isHexString('orderHash', orderHash);
    const web3Wrapper = new Web3Wrapper(provider);
    await assert.isSenderAddressAsync('signerAddress', signerAddress, web3Wrapper);
    const normalizedSignerAddress = signerAddress.toLowerCase();

    let msgHashHex = orderHash;
    const prefixedMsgHashHex = addSignedMessagePrefix(orderHash, messagePrefixOpts.prefixType);
    if (messagePrefixOpts.shouldAddPrefixBeforeCallingEthSign) {
        msgHashHex = prefixedMsgHashHex;
    }
    const signature = await web3Wrapper.signMessageAsync(normalizedSignerAddress, msgHashHex);

    // HACK: There is no consensus on whether the signatureHex string should be formatted as
    // v + r + s OR r + s + v, and different clients (even different versions of the same client)
    // return the signature params in different orders. In order to support all client implementations,
    // we parse the signature in both ways, and evaluate if either one is a valid signature.
    // tslint:disable-next-line:custom-no-magic-numbers
    const validVParamValues = [27, 28];
    const ecSignatureVRS = parseSignatureHexAsVRS(signature);
    if (_.includes(validVParamValues, ecSignatureVRS.v)) {
        const isValidVRSSignature = isValidECSignature(prefixedMsgHashHex, ecSignatureVRS, normalizedSignerAddress);
        if (isValidVRSSignature) {
            return ecSignatureVRS;
        }
    }

    const ecSignatureRSV = parseSignatureHexAsRSV(signature);
    if (_.includes(validVParamValues, ecSignatureRSV.v)) {
        const isValidRSVSignature = isValidECSignature(prefixedMsgHashHex, ecSignatureRSV, normalizedSignerAddress);
        if (isValidRSVSignature) {
            return ecSignatureRSV;
        }
    }

    throw new Error(OrderError.InvalidSignature);
}

/**
 * Adds the relevant prefix to the message being signed.
 * @param message Message to sign
 * @param messagePrefixType The type of message prefix to add. Different signers expect
 *                          specific message prefixes.
 * @return Prefixed message
 */
export function addSignedMessagePrefix(message: string, messagePrefixType: MessagePrefixType): string {
    switch (messagePrefixType) {
        case MessagePrefixType.None:
            return message;

        case MessagePrefixType.EthSign: {
            const msgBuff = ethUtil.toBuffer(message);
            const prefixedMsgBuff = ethUtil.hashPersonalMessage(msgBuff);
            const prefixedMsgHex = ethUtil.bufferToHex(prefixedMsgBuff);
            return prefixedMsgHex;
        }

        case MessagePrefixType.Trezor: {
            const msgBuff = ethUtil.toBuffer(message);
            const prefixedMsgBuff = hashTrezorPersonalMessage(msgBuff);
            const prefixedMsgHex = ethUtil.bufferToHex(prefixedMsgBuff);
            return prefixedMsgHex;
        }

        default:
            throw new Error(`Unrecognized MessagePrefixType: ${messagePrefixType}`);
    }
}

function hashTrezorPersonalMessage(message: Buffer): Buffer {
    const prefix = ethUtil.toBuffer('\x19Ethereum Signed Message:\n' + String.fromCharCode(message.length));
    return ethUtil.sha3(Buffer.concat([prefix, message]));
}

function parseECSignature(signature: string): ECSignature {
    const ecSignatureTypes = [SignatureType.EthSign, SignatureType.EIP712, SignatureType.Trezor];
    assert.isOneOfExpectedSignatureTypes(signature, ecSignatureTypes);

    // tslint:disable-next-line:custom-no-magic-numbers
    const vrsHex = signature.slice(0, -2);
    const ecSignature = parseSignatureHexAsVRS(vrsHex);

    return ecSignature;
}

function parseValidatorSignature(signature: string): ValidatorSignature {
    assert.isOneOfExpectedSignatureTypes(signature, [SignatureType.Validator]);
    // tslint:disable:custom-no-magic-numbers
    const validatorSignature = {
        validatorAddress: signature.slice(-22, -2),
        signature: signature.slice(0, -22),
    };
    // tslint:enable:custom-no-magic-numbers
    return validatorSignature;
}

function parseSignatureHexAsVRS(signatureHex: string): ECSignature {
    const signatureBuffer = ethUtil.toBuffer(signatureHex);
    let v = signatureBuffer[0];
    // HACK: Sometimes v is returned as [0, 1] and sometimes as [27, 28]
    // If it is returned as [0, 1], add 27 to both so it becomes [27, 28]
    const lowestValidV = 27;
    const isProperlyFormattedV = v >= lowestValidV;
    if (!isProperlyFormattedV) {
        v += lowestValidV;
    }
    // signatureBuffer contains vrs
    const vEndIndex = 1;
    const rsIndex = 33;
    const r = signatureBuffer.slice(vEndIndex, rsIndex);
    const sEndIndex = 65;
    const s = signatureBuffer.slice(rsIndex, sEndIndex);
    const ecSignature: ECSignature = {
        v,
        r: ethUtil.bufferToHex(r),
        s: ethUtil.bufferToHex(s),
    };
    return ecSignature;
}

function parseSignatureHexAsRSV(signatureHex: string): ECSignature {
    const { v, r, s } = ethUtil.fromRpcSig(signatureHex);
    const ecSignature: ECSignature = {
        v,
        r: ethUtil.bufferToHex(r),
        s: ethUtil.bufferToHex(s),
    };
    return ecSignature;
}
