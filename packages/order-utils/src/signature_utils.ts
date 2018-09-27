import { schemas } from '@0xproject/json-schemas';
import { ECSignature, SignatureType, SignerType, ValidatorSignature } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { assert } from './assert';
import { ExchangeContract } from './generated_contract_wrappers/exchange';
import { IValidatorContract } from './generated_contract_wrappers/i_validator';
import { IWalletContract } from './generated_contract_wrappers/i_wallet';
import { OrderError } from './types';
import { utils } from './utils';

export const signatureUtils = {
    /**
     * Verifies that the provided signature is valid according to the 0x Protocol smart contracts
     * @param   data          The hex encoded data signed by the supplied signature.
     * @param   signature     A hex encoded 0x Protocol signature made up of: [TypeSpecificData][SignatureType].
     *          E.g [vrs][SignatureType.EIP712]
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the signature is valid for the supplied signerAddress and data.
     */
    async isValidSignatureAsync(
        provider: Provider,
        data: string,
        signature: string,
        signerAddress: string,
    ): Promise<boolean> {
        assert.isWeb3Provider('provider', provider);
        assert.isHexString('data', data);
        assert.isHexString('signature', signature);
        assert.isETHAddressHex('signerAddress', signerAddress);
        const signatureTypeIndexIfExists = utils.getSignatureTypeIndexIfExists(signature);
        if (_.isUndefined(signatureTypeIndexIfExists)) {
            throw new Error(`Unrecognized signatureType in signature: ${signature}`);
        }

        switch (signatureTypeIndexIfExists) {
            case SignatureType.Illegal:
            case SignatureType.Invalid:
                return false;

            case SignatureType.EIP712: {
                const ecSignature = signatureUtils.parseECSignature(signature);
                return signatureUtils.isValidECSignature(data, ecSignature, signerAddress);
            }

            case SignatureType.EthSign: {
                const ecSignature = signatureUtils.parseECSignature(signature);
                const prefixedMessageHex = signatureUtils.addSignedMessagePrefix(data, SignerType.Default);
                return signatureUtils.isValidECSignature(prefixedMessageHex, ecSignature, signerAddress);
            }

            case SignatureType.Wallet: {
                const isValid = await signatureUtils.isValidWalletSignatureAsync(
                    provider,
                    data,
                    signature,
                    signerAddress,
                );
                return isValid;
            }

            case SignatureType.Validator: {
                const isValid = await signatureUtils.isValidValidatorSignatureAsync(
                    provider,
                    data,
                    signature,
                    signerAddress,
                );
                return isValid;
            }

            case SignatureType.PreSigned: {
                return signatureUtils.isValidPresignedSignatureAsync(provider, data, signerAddress);
            }

            default:
                throw new Error(`Unhandled SignatureType: ${signatureTypeIndexIfExists}`);
        }
    },
    /**
     * Verifies that the provided presigned signature is valid according to the 0x Protocol smart contracts
     * @param   provider      Web3 provider to use for all JSON RPC requests
     * @param   data          The hex encoded data signed by the supplied signature
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the data was preSigned by the supplied signerAddress
     */
    async isValidPresignedSignatureAsync(provider: Provider, data: string, signerAddress: string): Promise<boolean> {
        assert.isWeb3Provider('provider', provider);
        assert.isHexString('data', data);
        assert.isETHAddressHex('signerAddress', signerAddress);
        const exchangeContract = new ExchangeContract(artifacts.Exchange.compilerOutput.abi, signerAddress, provider);
        const isValid = await exchangeContract.preSigned.callAsync(data, signerAddress);
        return isValid;
    },
    /**
     * Verifies that the provided wallet signature is valid according to the 0x Protocol smart contracts
     * @param   provider      Web3 provider to use for all JSON RPC requests
     * @param   data          The hex encoded data signed by the supplied signature.
     * @param   signature     A hex encoded presigned 0x Protocol signature made up of: [SignatureType.Presigned]
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the data was preSigned by the supplied signerAddress.
     */
    async isValidWalletSignatureAsync(
        provider: Provider,
        data: string,
        signature: string,
        signerAddress: string,
    ): Promise<boolean> {
        assert.isWeb3Provider('provider', provider);
        assert.isHexString('data', data);
        assert.isHexString('signature', signature);
        assert.isETHAddressHex('signerAddress', signerAddress);
        // tslint:disable-next-line:custom-no-magic-numbers
        const signatureWithoutType = signature.slice(-2);
        const walletContract = new IWalletContract(artifacts.IWallet.compilerOutput.abi, signerAddress, provider);
        const isValid = await walletContract.isValidSignature.callAsync(data, signatureWithoutType);
        return isValid;
    },
    /**
     * Verifies that the provided validator signature is valid according to the 0x Protocol smart contracts
     * @param   provider      Web3 provider to use for all JSON RPC requests
     * @param   data          The hex encoded data signed by the supplied signature.
     * @param   signature     A hex encoded presigned 0x Protocol signature made up of: [SignatureType.Presigned]
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the data was preSigned by the supplied signerAddress.
     */
    async isValidValidatorSignatureAsync(
        provider: Provider,
        data: string,
        signature: string,
        signerAddress: string,
    ): Promise<boolean> {
        assert.isWeb3Provider('provider', provider);
        assert.isHexString('data', data);
        assert.isHexString('signature', signature);
        assert.isETHAddressHex('signerAddress', signerAddress);
        const validatorSignature = parseValidatorSignature(signature);
        const exchangeContract = new ExchangeContract(artifacts.Exchange.compilerOutput.abi, signerAddress, provider);
        const isValidatorApproved = await exchangeContract.allowedValidators.callAsync(
            signerAddress,
            validatorSignature.validatorAddress,
        );
        if (!isValidatorApproved) {
            throw new Error(
                `Validator ${validatorSignature.validatorAddress} was not pre-approved by ${signerAddress}.`,
            );
        }

        const validatorContract = new IValidatorContract(
            artifacts.IValidator.compilerOutput.abi,
            signerAddress,
            provider,
        );
        const isValid = await validatorContract.isValidSignature.callAsync(
            data,
            signerAddress,
            validatorSignature.signature,
        );
        return isValid;
    },
    /**
     * Checks if the supplied elliptic curve signature corresponds to signing `data` with
     * the private key corresponding to `signerAddress`
     * @param   data          The hex encoded data signed by the supplied signature.
     * @param   signature     An object containing the elliptic curve signature parameters.
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return Whether the ECSignature is valid.
     */
    isValidECSignature(data: string, signature: ECSignature, signerAddress: string): boolean {
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
            const normalizedRetrievedAddress = retrievedAddress.toLowerCase();
            return normalizedRetrievedAddress === normalizedSignerAddress;
        } catch (err) {
            return false;
        }
    },
    /**
     * Signs an orderHash and returns it's elliptic curve signature and signature type.
     * This method currently supports TestRPC, Geth and Parity above and below V1.6.6
     * @param   orderHash       Hex encoded orderHash to sign.
     * @param   signerAddress   The hex encoded Ethereum address you wish to sign it with. This address
     *          must be available via the Provider supplied to 0x.js.
     * @param   signerType Different signers add/require different prefixes to be prepended to the message being signed.
     *          Since we cannot know ahead of time which signer you are using, you must supply a SignerType.
     * @return  A hex encoded string containing the Elliptic curve signature generated by signing the orderHash and the Signature Type.
     */
    async ecSignOrderHashAsync(
        provider: Provider,
        orderHash: string,
        signerAddress: string,
        signerType: SignerType,
    ): Promise<string> {
        assert.isWeb3Provider('provider', provider);
        assert.isHexString('orderHash', orderHash);
        assert.isETHAddressHex('signerAddress', signerAddress);
        const web3Wrapper = new Web3Wrapper(provider);
        await assert.isSenderAddressAsync('signerAddress', signerAddress, web3Wrapper);
        const normalizedSignerAddress = signerAddress.toLowerCase();

        let msgHashHex = orderHash;
        const prefixedMsgHashHex = signatureUtils.addSignedMessagePrefix(orderHash, signerType);
        // Metamask incorrectly implements eth_sign and does not prefix the message as per the spec
        // Source: https://github.com/MetaMask/metamask-extension/commit/a9d36860bec424dcee8db043d3e7da6a5ff5672e
        if (signerType === SignerType.Metamask) {
            msgHashHex = prefixedMsgHashHex;
        }
        const signature = await web3Wrapper.signMessageAsync(normalizedSignerAddress, msgHashHex);

        // HACK: There is no consensus on whether the signatureHex string should be formatted as
        // v + r + s OR r + s + v, and different clients (even different versions of the same client)
        // return the signature params in different orders. In order to support all client implementations,
        // we parse the signature in both ways, and evaluate if either one is a valid signature.
        // r + s + v is the most prevalent format from eth_sign, so we attempt this first.
        // tslint:disable-next-line:custom-no-magic-numbers
        const validVParamValues = [27, 28];
        const ecSignatureRSV = parseSignatureHexAsRSV(signature);
        if (_.includes(validVParamValues, ecSignatureRSV.v)) {
            const isValidRSVSignature = signatureUtils.isValidECSignature(
                prefixedMsgHashHex,
                ecSignatureRSV,
                normalizedSignerAddress,
            );
            if (isValidRSVSignature) {
                const convertedSignatureHex = signatureUtils.convertECSignatureToSignatureHex(
                    ecSignatureRSV,
                    signerType,
                );
                return convertedSignatureHex;
            }
        }
        const ecSignatureVRS = parseSignatureHexAsVRS(signature);
        if (_.includes(validVParamValues, ecSignatureVRS.v)) {
            const isValidVRSSignature = signatureUtils.isValidECSignature(
                prefixedMsgHashHex,
                ecSignatureVRS,
                normalizedSignerAddress,
            );
            if (isValidVRSSignature) {
                const convertedSignatureHex = signatureUtils.convertECSignatureToSignatureHex(
                    ecSignatureVRS,
                    signerType,
                );
                return convertedSignatureHex;
            }
        }

        throw new Error(OrderError.InvalidSignature);
    },
    /**
     * Combines ECSignature with V,R,S and the relevant signature type for use in 0x protocol
     * @param ecSignature The ECSignature of the signed data
     * @param signerType The SignerType of the signed data
     * @return Hex encoded string of signature (v,r,s) with Signature Type
     */
    convertECSignatureToSignatureHex(ecSignature: ECSignature, signerType: SignerType): string {
        const signatureBuffer = Buffer.concat([
            ethUtil.toBuffer(ecSignature.v),
            ethUtil.toBuffer(ecSignature.r),
            ethUtil.toBuffer(ecSignature.s),
        ]);
        const signatureHex = `0x${signatureBuffer.toString('hex')}`;
        let signatureType;
        switch (signerType) {
            case SignerType.Metamask:
            case SignerType.Ledger:
            case SignerType.Default: {
                signatureType = SignatureType.EthSign;
                break;
            }
            default:
                throw new Error(`Unrecognized SignerType: ${signerType}`);
        }
        const signatureWithType = signatureUtils.convertToSignatureWithType(signatureHex, signatureType);
        return signatureWithType;
    },
    /**
     * Combines the signature proof and the Signature Type.
     * @param signature The hex encoded signature proof
     * @param signatureType The signature type, i.e EthSign, Wallet etc.
     * @return Hex encoded string of signature proof with Signature Type
     */
    convertToSignatureWithType(signature: string, signatureType: SignatureType): string {
        const signatureBuffer = Buffer.concat([ethUtil.toBuffer(signature), ethUtil.toBuffer(signatureType)]);
        const signatureHex = `0x${signatureBuffer.toString('hex')}`;
        return signatureHex;
    },
    /**
     * Adds the relevant prefix to the message being signed.
     * @param message Message to sign
     * @param signerType The type of message prefix to add for a given SignerType. Different signers expect
     *                          specific message prefixes.
     * @return Prefixed message
     */
    addSignedMessagePrefix(message: string, signerType: SignerType = SignerType.Default): string {
        assert.isString('message', message);
        assert.doesBelongToStringEnum('signerType', signerType, SignerType);
        switch (signerType) {
            case SignerType.Metamask:
            case SignerType.Ledger:
            case SignerType.Default: {
                const msgBuff = ethUtil.toBuffer(message);
                const prefixedMsgBuff = ethUtil.hashPersonalMessage(msgBuff);
                const prefixedMsgHex = ethUtil.bufferToHex(prefixedMsgBuff);
                return prefixedMsgHex;
            }
            default:
                throw new Error(`Unrecognized SignerType: ${signerType}`);
        }
    },
    /**
     * Parse a 0x protocol hex-encoded signature string into it's ECSignature components
     * @param signature A hex encoded ecSignature 0x Protocol signature
     * @return An ECSignature object with r,s,v parameters
     */
    parseECSignature(signature: string): ECSignature {
        assert.isHexString('signature', signature);
        const ecSignatureTypes = [SignatureType.EthSign, SignatureType.EIP712];
        assert.isOneOfExpectedSignatureTypes(signature, ecSignatureTypes);

        // tslint:disable-next-line:custom-no-magic-numbers
        const vrsHex = signature.slice(0, -2);
        const ecSignature = parseSignatureHexAsVRS(vrsHex);

        return ecSignature;
    },
};

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
