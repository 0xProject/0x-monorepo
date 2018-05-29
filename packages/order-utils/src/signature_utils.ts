import { schemas } from '@0xproject/json-schemas';
import { ECSignature, Provider, SignatureType } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { assert } from './assert';
import { ExchangeContract } from './generated_contract_wrappers/exchange';
import { ISignerContract } from './generated_contract_wrappers/i_signer';
import { OrderError } from './types';

/**
 * Verifies that the provided signature is valid according to the 0x Protocol smart contracts
 * @param   data          The hex encoded data signed by the supplied signature.
 * @param   signature     An object containing the elliptic curve signature parameters.
 * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
 * @return  Whether the signature is valid for the supplied signerAddress and data.
 */
export async function isValidSignatureAsync(
    provider: Provider,
    data: string,
    signature: string,
    signerAddress: string,
): Promise<boolean> {
    const signatureTypeIndexIfExists = getSignatureTypeIndexIfExists(signature);
    if (_.isUndefined(signatureTypeIndexIfExists)) {
        throw new Error(`Unrecognized signatureType in signature: ${signature}`);
    }

    switch (signatureTypeIndexIfExists) {
        case SignatureType.Illegal:
        case SignatureType.Invalid:
            return false;

        // Question: Does it make sense to handle this?
        case SignatureType.Caller:
            return true;

        // TODO: Rename this type to `EthSign` b/c multiple of the signature
        // types use ECRecover...
        case SignatureType.Ecrecover: {
            const ecSignature = parseECSignature(signature);
            const dataBuff = ethUtil.toBuffer(data);
            const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
            const msgHash = ethUtil.bufferToHex(msgHashBuff);
            return isValidECSignature(msgHash, ecSignature, signerAddress);
        }

        case SignatureType.EIP712: {
            const ecSignature = parseECSignature(signature);
            return isValidECSignature(data, ecSignature, signerAddress);
        }

        case SignatureType.Trezor: {
            const dataBuff = ethUtil.toBuffer(data);
            const msgHashBuff = hashTrezorPersonalMessage(dataBuff);
            const msgHash = ethUtil.bufferToHex(msgHashBuff);
            const ecSignature = parseECSignature(signature);
            return isValidECSignature(msgHash, ecSignature, signerAddress);
        }

        // TODO: Rename Contract -> Wallet
        case SignatureType.Contract: {
            const signerContract = new ISignerContract(artifacts.ISigner.abi, signerAddress, provider);
            const isValid = await signerContract.isValidSignature.callAsync(data, signature);
            return isValid;
        }

        case SignatureType.PreSigned: {
            const exchangeContract = new ExchangeContract(artifacts.Exchange.abi, signerAddress, provider);
            const isValid = await exchangeContract.preSigned.callAsync(data, signerAddress);
            return true;
        }

        default:
            throw new Error(`Unhandled SignatureType: ${signatureTypeIndexIfExists}`);
    }
}

export function getVRSHexString(ecSignature: ECSignature): string {
    const vrs = `0x${intToHex(ecSignature.v)}${ethUtil.stripHexPrefix(ecSignature.r)}${ethUtil.stripHexPrefix(
        ecSignature.s,
    )}`;
    return vrs;
}

export function isValidECSignature(data: string, signature: ECSignature, signerAddress: string): boolean {
    assert.isHexString('data', data);
    assert.doesConformToSchema('signature', signature, schemas.ecSignatureSchema);
    assert.isETHAddressHex('signerAddress', signerAddress);
    const normalizedSignerAddress = signerAddress.toLowerCase();

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
 * @param   shouldAddPersonalMessagePrefix  Some signers add the personal message prefix `\x19Ethereum Signed Message`
 *          themselves (e.g Parity Signer, Ledger, TestRPC) and others expect it to already be done by the client
 *          (e.g Metamask). Depending on which signer this request is going to, decide on whether to add the prefix
 *          before sending the request.
 * @return  An object containing the Elliptic curve signature parameters generated by signing the orderHash.
 */
export async function ecSignOrderHashAsync(
    provider: Provider,
    orderHash: string,
    signerAddress: string,
    shouldAddPersonalMessagePrefix: boolean,
): Promise<ECSignature> {
    assert.isHexString('orderHash', orderHash);
    const web3Wrapper = new Web3Wrapper(provider);
    await assert.isSenderAddressAsync('signerAddress', signerAddress, web3Wrapper);
    const normalizedSignerAddress = signerAddress.toLowerCase();

    let msgHashHex = orderHash;
    if (shouldAddPersonalMessagePrefix) {
        const orderHashBuff = ethUtil.toBuffer(orderHash);
        const msgHashBuff = ethUtil.hashPersonalMessage(orderHashBuff);
        msgHashHex = ethUtil.bufferToHex(msgHashBuff);
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
        const isValidVRSSignature = isValidECSignature(orderHash, ecSignatureVRS, normalizedSignerAddress);
        if (isValidVRSSignature) {
            return ecSignatureVRS;
        }
    }

    const ecSignatureRSV = parseSignatureHexAsRSV(signature);
    if (_.includes(validVParamValues, ecSignatureRSV.v)) {
        const isValidRSVSignature = isValidECSignature(orderHash, ecSignatureRSV, normalizedSignerAddress);
        if (isValidRSVSignature) {
            return ecSignatureRSV;
        }
    }

    throw new Error(OrderError.InvalidSignature);
}

function hashTrezorPersonalMessage(message: Buffer): Buffer {
    const prefix = ethUtil.toBuffer('\x19Ethereum Signed Message:\n' + String.fromCharCode(message.length));
    return ethUtil.sha3(Buffer.concat([prefix, message]));
}

function parseECSignature(signature: string): ECSignature {
    const signatureTypeIndexIfExists = getSignatureTypeIndexIfExists(signature);
    const ecSignatureTypes = [SignatureType.Ecrecover, SignatureType.EIP712, SignatureType.Trezor];
    const isECSignatureType = _.includes(ecSignatureTypes, signatureTypeIndexIfExists);
    if (!isECSignatureType) {
        throw new Error(`Cannot parse non-ECSignature type: ${signatureTypeIndexIfExists}`);
    }

    // tslint:disable-next-line:custom-no-magic-numbers
    const vrsHex = `0x${signature.substr(4)}`;
    const ecSignature = parseSignatureHexAsVRS(vrsHex);

    return ecSignature;
}

function intToHex(i: number): string {
    const hex = ethUtil.bufferToHex(ethUtil.toBuffer(i));
    return hex;
}

function getSignatureTypeIndexIfExists(signature: string): number {
    const unprefixedSignature = ethUtil.stripHexPrefix(signature);
    const signatureTypeHex = unprefixedSignature.substr(0, 2);
    const base = 16;
    const signatureTypeInt = parseInt(signatureTypeHex, base);
    return signatureTypeInt;
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
