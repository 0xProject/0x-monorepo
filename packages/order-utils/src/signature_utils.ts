import { ExchangeContract, IValidatorContract, IWalletContract } from '@0x/abi-gen-wrappers';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { schemas } from '@0x/json-schemas';
import {
    ECSignature,
    Order,
    SignatureType,
    SignedOrder,
    SignedZeroExTransaction,
    ValidatorSignature,
    ZeroExTransaction,
} from '@0x/types';
import { providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { assert } from './assert';
import { eip712Utils } from './eip712_utils';
import { orderHashUtils } from './order_hash';
import { transactionHashUtils } from './transaction_hash';
import { PresignedSignatureOpts, SignatureValidationOpts, TypedDataError, ValidatorSignatureOpts } from './types';
import { utils } from './utils';

export const signatureUtils = {
    /**
     * Verifies that the provided signature is valid according to the 0x Protocol smart contracts
     * @param   supportedProvider      Web3 provider to use for all JSON RPC requests
     * @param   data          The hex encoded data signed by the supplied signature.
     * @param   signature     A hex encoded 0x Protocol signature made up of: [TypeSpecificData][SignatureType].
     *          E.g [vrs][SignatureType.EIP712]
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the signature is valid for the supplied signerAddress and data.
     */
    async isValidSignatureAsync(
        supportedProvider: SupportedProvider,
        data: string,
        signature: string,
        signerAddress: string,
        signatureValidationOpts?: SignatureValidationOpts,
    ): Promise<boolean> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isHexString('data', data);
        assert.isHexString('signature', signature);
        assert.isETHAddressHex('signerAddress', signerAddress);
        const signatureTypeIndexIfExists = utils.getSignatureTypeIndexIfExists(signature);
        if (signatureTypeIndexIfExists === undefined) {
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
                const prefixedMessageHex = signatureUtils.addSignedMessagePrefix(data);
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
                const exchangeAddress =
                    signatureValidationOpts && (signatureValidationOpts as ValidatorSignatureOpts).exchangeAddress;
                const isValid = await signatureUtils.isValidValidatorSignatureAsync(
                    provider,
                    data,
                    signature,
                    signerAddress,
                    exchangeAddress,
                );
                return isValid;
            }

            case SignatureType.PreSigned: {
                const exchangeAddress =
                    signatureValidationOpts && (signatureValidationOpts as PresignedSignatureOpts).exchangeAddress;
                return signatureUtils.isValidPresignedSignatureAsync(provider, data, signerAddress, exchangeAddress);
            }

            default:
                throw new Error(`Unhandled SignatureType: ${signatureTypeIndexIfExists}`);
        }
    },
    /**
     * Verifies that the provided presigned signature is valid according to the 0x Protocol smart contracts
     * @param   supportedProvider      Web3 provider to use for all JSON RPC requests
     * @param   data          The hex encoded data signed by the supplied signature
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the data was preSigned by the supplied signerAddress
     */
    async isValidPresignedSignatureAsync(
        supportedProvider: SupportedProvider,
        data: string,
        signerAddress: string,
        exchangeAddress?: string,
    ): Promise<boolean> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isHexString('data', data);
        assert.isETHAddressHex('signerAddress', signerAddress);

        let exchangeContract: ExchangeContract;
        if (exchangeAddress) {
            assert.isETHAddressHex('exchange', exchangeAddress);
            exchangeContract = new ExchangeContract(exchangeAddress, provider);
        } else {
            const web3Wrapper = new Web3Wrapper(provider);
            const networkId = await web3Wrapper.getNetworkIdAsync();
            const addresses = getContractAddressesForNetworkOrThrow(networkId);
            exchangeContract = new ExchangeContract(addresses.exchange, provider);
        }

        const isValid = await exchangeContract.preSigned.callAsync(data, signerAddress);
        return isValid;
    },
    /**
     * Verifies that the provided wallet signature is valid according to the 0x Protocol smart contracts
     * @param   supportedProvider      Web3 provider to use for all JSON RPC requests
     * @param   data          The hex encoded data signed by the supplied signature.
     * @param   signature     A hex encoded presigned 0x Protocol signature made up of: [SignatureType.Presigned]
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the data was preSigned by the supplied signerAddress.
     */
    async isValidWalletSignatureAsync(
        supportedProvider: SupportedProvider,
        data: string,
        signature: string,
        signerAddress: string,
    ): Promise<boolean> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isHexString('data', data);
        assert.isHexString('signature', signature);
        assert.isETHAddressHex('signerAddress', signerAddress);
        // tslint:disable-next-line:custom-no-magic-numbers
        const signatureWithoutType = signature.slice(0, -2);
        const walletContract = new IWalletContract(signerAddress, provider);
        const isValid = await walletContract.isValidSignature.callAsync(data, signatureWithoutType);
        return isValid;
    },
    /**
     * Verifies that the provided validator signature is valid according to the 0x Protocol smart contracts
     * @param   supportedProvider      Web3 provider to use for all JSON RPC requests
     * @param   data          The hex encoded data signed by the supplied signature.
     * @param   signature     A hex encoded presigned 0x Protocol signature made up of: [SignatureType.Presigned]
     * @param   signerAddress The hex encoded address that signed the data, producing the supplied signature.
     * @return  Whether the data was preSigned by the supplied signerAddress.
     */
    async isValidValidatorSignatureAsync(
        supportedProvider: SupportedProvider,
        data: string,
        signature: string,
        signerAddress: string,
        exchangeAddress?: string,
    ): Promise<boolean> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isHexString('data', data);
        assert.isHexString('signature', signature);
        assert.isETHAddressHex('signerAddress', signerAddress);

        let exchangeContract: ExchangeContract;
        if (exchangeAddress) {
            assert.isETHAddressHex('exchange', exchangeAddress);
            exchangeContract = new ExchangeContract(exchangeAddress, provider);
        } else {
            const web3Wrapper = new Web3Wrapper(provider);
            const networkId = await web3Wrapper.getNetworkIdAsync();
            const addresses = getContractAddressesForNetworkOrThrow(networkId);
            exchangeContract = new ExchangeContract(addresses.exchange, provider);
        }

        const validatorSignature = signatureUtils.parseValidatorSignature(signature);
        const isValidatorApproved = await exchangeContract.allowedValidators.callAsync(
            signerAddress,
            validatorSignature.validatorAddress,
        );
        if (!isValidatorApproved) {
            throw new Error(
                `Validator ${validatorSignature.validatorAddress} was not pre-approved by ${signerAddress}.`,
            );
        }

        const validatorContract = new IValidatorContract(validatorSignature.validatorAddress, provider);
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
     * Signs an order and returns a SignedOrder. First `eth_signTypedData` is requested
     * then a fallback to `eth_sign` if not available on the supplied provider.
     * @param   supportedProvider      Web3 provider to use for all JSON RPC requests
     * @param   order The Order to sign.
     * @param   signerAddress   The hex encoded Ethereum address you wish to sign it with. This address
     *          must be available via the supplied Provider.
     * @return  A SignedOrder containing the order and Elliptic curve signature with Signature Type.
     */
    async ecSignOrderAsync(
        supportedProvider: SupportedProvider,
        order: Order,
        signerAddress: string,
    ): Promise<SignedOrder> {
        assert.doesConformToSchema('order', order, schemas.orderSchema, [schemas.hexSchema]);
        try {
            const signedOrder = await signatureUtils.ecSignTypedDataOrderAsync(supportedProvider, order, signerAddress);
            return signedOrder;
        } catch (err) {
            // HACK: We are unable to handle specific errors thrown since provider is not an object
            //       under our control. It could be Metamask Web3, Ethers, or any general RPC provider.
            //       We check for a user denying the signature request in a way that supports Metamask and
            //       Coinbase Wallet. Unfortunately for signers with a different error message,
            //       they will receive two signature requests.
            if (err.message.includes('User denied message signature')) {
                throw err;
            }
            const orderHash = orderHashUtils.getOrderHashHex(order);
            const signatureHex = await signatureUtils.ecSignHashAsync(supportedProvider, orderHash, signerAddress);
            const signedOrder = {
                ...order,
                signature: signatureHex,
            };
            return signedOrder;
        }
    },
    /**
     * Signs an order using `eth_signTypedData` and returns a SignedOrder.
     * @param   supportedProvider      Web3 provider to use for all JSON RPC requests
     * @param   order The Order to sign.
     * @param   signerAddress   The hex encoded Ethereum address you wish to sign it with. This address
     *          must be available via the supplied Provider.
     * @return  A SignedOrder containing the order and Elliptic curve signature with Signature Type.
     */
    async ecSignTypedDataOrderAsync(
        supportedProvider: SupportedProvider,
        order: Order,
        signerAddress: string,
    ): Promise<SignedOrder> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isETHAddressHex('signerAddress', signerAddress);
        assert.doesConformToSchema('order', order, schemas.orderSchema, [schemas.hexSchema]);
        const web3Wrapper = new Web3Wrapper(provider);
        await assert.isSenderAddressAsync('signerAddress', signerAddress, web3Wrapper);
        const normalizedSignerAddress = signerAddress.toLowerCase();
        const typedData = eip712Utils.createOrderTypedData(order);
        try {
            const signature = await web3Wrapper.signTypedDataAsync(normalizedSignerAddress, typedData);
            const ecSignatureRSV = parseSignatureHexAsRSV(signature);
            const signatureBuffer = Buffer.concat([
                ethUtil.toBuffer(ecSignatureRSV.v),
                ethUtil.toBuffer(ecSignatureRSV.r),
                ethUtil.toBuffer(ecSignatureRSV.s),
                ethUtil.toBuffer(SignatureType.EIP712),
            ]);
            const signatureHex = `0x${signatureBuffer.toString('hex')}`;
            return {
                ...order,
                signature: signatureHex,
            };
        } catch (err) {
            // Detect if Metamask to transition users to the MetamaskSubprovider
            if ((provider as any).isMetaMask) {
                throw new Error(TypedDataError.InvalidMetamaskSigner);
            } else {
                throw err;
            }
        }
    },
    /**
     * Signs a transaction and returns a SignedZeroExTransaction. First `eth_signTypedData` is requested
     * then a fallback to `eth_sign` if not available on the supplied provider.
     * @param   supportedProvider      Web3 provider to use for all JSON RPC requests
     * @param   transaction The ZeroExTransaction to sign.
     * @param   signerAddress   The hex encoded Ethereum address you wish to sign it with. This address
     *          must be available via the supplied Provider.
     * @return  A SignedTransaction containing the order and Elliptic curve signature with Signature Type.
     */
    async ecSignTransactionAsync(
        supportedProvider: SupportedProvider,
        transaction: ZeroExTransaction,
        signerAddress: string,
    ): Promise<SignedZeroExTransaction> {
        assert.doesConformToSchema('transaction', transaction, schemas.zeroExTransactionSchema, [schemas.hexSchema]);
        try {
            const signedTransaction = await signatureUtils.ecSignTypedDataTransactionAsync(
                supportedProvider,
                transaction,
                signerAddress,
            );
            return signedTransaction;
        } catch (err) {
            // HACK: We are unable to handle specific errors thrown since provider is not an object
            //       under our control. It could be Metamask Web3, Ethers, or any general RPC provider.
            //       We check for a user denying the signature request in a way that supports Metamask and
            //       Coinbase Wallet. Unfortunately for signers with a different error message,
            //       they will receive two signature requests.
            if (err.message.includes('User denied message signature')) {
                throw err;
            }
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const signatureHex = await signatureUtils.ecSignHashAsync(
                supportedProvider,
                transactionHash,
                signerAddress,
            );
            const signedTransaction = {
                ...transaction,
                signature: signatureHex,
            };
            return signedTransaction;
        }
    },
    /**
     * Signs a ZeroExTransaction using `eth_signTypedData` and returns a SignedZeroExTransaction.
     * @param   supportedProvider      Web3 provider to use for all JSON RPC requests
     * @param   transaction            The ZeroEx Transaction to sign.
     * @param   signerAddress          The hex encoded Ethereum address you wish to sign it with. This address
     *          must be available via the supplied Provider.
     * @return  A SignedZeroExTransaction containing the ZeroExTransaction and Elliptic curve signature with Signature Type.
     */
    async ecSignTypedDataTransactionAsync(
        supportedProvider: SupportedProvider,
        transaction: ZeroExTransaction,
        signerAddress: string,
    ): Promise<SignedZeroExTransaction> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isETHAddressHex('signerAddress', signerAddress);
        assert.doesConformToSchema('transaction', transaction, schemas.zeroExTransactionSchema, [schemas.hexSchema]);
        const web3Wrapper = new Web3Wrapper(provider);
        await assert.isSenderAddressAsync('signerAddress', signerAddress, web3Wrapper);
        const normalizedSignerAddress = signerAddress.toLowerCase();
        const typedData = eip712Utils.createZeroExTransactionTypedData(transaction);
        try {
            const signature = await web3Wrapper.signTypedDataAsync(normalizedSignerAddress, typedData);
            const ecSignatureRSV = parseSignatureHexAsRSV(signature);
            const signatureBuffer = Buffer.concat([
                ethUtil.toBuffer(ecSignatureRSV.v),
                ethUtil.toBuffer(ecSignatureRSV.r),
                ethUtil.toBuffer(ecSignatureRSV.s),
                ethUtil.toBuffer(SignatureType.EIP712),
            ]);
            const signatureHex = `0x${signatureBuffer.toString('hex')}`;
            return {
                ...transaction,
                signature: signatureHex,
            };
        } catch (err) {
            // Detect if Metamask to transition users to the MetamaskSubprovider
            if ((provider as any).isMetaMask) {
                throw new Error(TypedDataError.InvalidMetamaskSigner);
            } else {
                throw err;
            }
        }
    },
    /**
     * Signs a hash using `eth_sign` and returns its elliptic curve signature and signature type.
     * @param   supportedProvider      Web3 provider to use for all JSON RPC requests
     * @param   msgHash       Hex encoded message to sign.
     * @param   signerAddress   The hex encoded Ethereum address you wish to sign it with. This address
     *          must be available via the supplied Provider.
     * @return  A hex encoded string containing the Elliptic curve signature generated by signing the msgHash and the Signature Type.
     */
    async ecSignHashAsync(
        supportedProvider: SupportedProvider,
        msgHash: string,
        signerAddress: string,
    ): Promise<string> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isHexString('msgHash', msgHash);
        assert.isETHAddressHex('signerAddress', signerAddress);
        const web3Wrapper = new Web3Wrapper(provider);
        await assert.isSenderAddressAsync('signerAddress', signerAddress, web3Wrapper);
        const normalizedSignerAddress = signerAddress.toLowerCase();
        const signature = await web3Wrapper.signMessageAsync(normalizedSignerAddress, msgHash);
        const prefixedMsgHashHex = signatureUtils.addSignedMessagePrefix(msgHash);

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
                const convertedSignatureHex = signatureUtils.convertECSignatureToSignatureHex(ecSignatureRSV);
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
                const convertedSignatureHex = signatureUtils.convertECSignatureToSignatureHex(ecSignatureVRS);
                return convertedSignatureHex;
            }
        }
        // Detect if Metamask to transition users to the MetamaskSubprovider
        if ((provider as any).isMetaMask) {
            throw new Error(TypedDataError.InvalidMetamaskSigner);
        } else {
            throw new Error(TypedDataError.InvalidSignature);
        }
    },
    /**
     * Combines ECSignature with V,R,S and the EthSign signature type for use in 0x protocol
     * @param ecSignature The ECSignature of the signed data
     * @return Hex encoded string of signature (v,r,s) with Signature Type
     */
    convertECSignatureToSignatureHex(ecSignature: ECSignature): string {
        const signatureBuffer = Buffer.concat([
            ethUtil.toBuffer(ecSignature.v),
            ethUtil.toBuffer(ecSignature.r),
            ethUtil.toBuffer(ecSignature.s),
        ]);
        const signatureHex = `0x${signatureBuffer.toString('hex')}`;
        const signatureWithType = signatureUtils.convertToSignatureWithType(signatureHex, SignatureType.EthSign);
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
     * @return Prefixed message
     */
    addSignedMessagePrefix(message: string): string {
        assert.isString('message', message);
        const msgBuff = ethUtil.toBuffer(message);
        const prefixedMsgBuff = ethUtil.hashPersonalMessage(msgBuff);
        const prefixedMsgHex = ethUtil.bufferToHex(prefixedMsgBuff);
        return prefixedMsgHex;
    },
    /**
     * Parse a 0x protocol hex-encoded signature string into its ECSignature components
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

    /**
     * Parse a hex-encoded Validator signature into validator address and signature components
     * @param signature A hex encoded Validator 0x Protocol signature
     * @return A ValidatorSignature with validatorAddress and signature parameters
     */
    parseValidatorSignature(signature: string): ValidatorSignature {
        assert.isOneOfExpectedSignatureTypes(signature, [SignatureType.Validator]);
        // tslint:disable:custom-no-magic-numbers
        const validatorSignature = {
            validatorAddress: `0x${signature.slice(-42, -2)}`,
            signature: signature.slice(0, -42),
        };
        // tslint:enable:custom-no-magic-numbers
        return validatorSignature;
    },
};

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
// tslint:disable:max-file-line-count
