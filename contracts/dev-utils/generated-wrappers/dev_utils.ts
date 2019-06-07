// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import { BaseContract, PromiseWithTransactionHash } from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
    CallData,
    ContractAbi,
    ContractArtifact,
    DecodedLogArgs,
    MethodAbi,
    TransactionReceiptWithDecodedLogs,
    TxData,
    TxDataPayable,
    SupportedProvider,
} from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class DevUtilsContract extends BaseContract {
    public decodeERC721AssetData = {
        async callAsync(
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, BigNumber]
        > {
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeERC721AssetData(bytes)', [assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('decodeERC721AssetData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string, BigNumber]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getBalanceAndAssetProxyAllowance = {
        async callAsync(
            ownerAddress: string,
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber, BigNumber]
        > {
            assert.isString('ownerAddress', ownerAddress);
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getBalanceAndAssetProxyAllowance(address,bytes)', [ownerAddress,
        assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getBalanceAndAssetProxyAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public ERC1155_PROXY_ID = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('ERC1155_PROXY_ID()', []);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('ERC1155_PROXY_ID()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getTransferableAssetAmount = {
        async callAsync(
            ownerAddress: string,
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            assert.isString('ownerAddress', ownerAddress);
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getTransferableAssetAmount(address,bytes)', [ownerAddress,
        assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getTransferableAssetAmount(address,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getBatchAssetProxyAllowances = {
        async callAsync(
            ownerAddress: string,
            assetData: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber[]
        > {
            assert.isString('ownerAddress', ownerAddress);
            assert.isArray('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getBatchAssetProxyAllowances(address,bytes[])', [ownerAddress,
        assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getBatchAssetProxyAllowances(address,bytes[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public encodeERC20AssetData = {
        async callAsync(
            tokenAddress: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            assert.isString('tokenAddress', tokenAddress);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('encodeERC20AssetData(address)', [tokenAddress
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('encodeERC20AssetData(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public decodeZeroExTransactionData = {
        async callAsync(
            transactionData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string;makerFeeAssetData: string;takerFeeAssetData: string}>, BigNumber[], string[]]
        > {
            assert.isString('transactionData', transactionData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeZeroExTransactionData(bytes)', [transactionData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('decodeZeroExTransactionData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string;makerFeeAssetData: string;takerFeeAssetData: string}>, BigNumber[], string[]]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getBalance = {
        async callAsync(
            ownerAddress: string,
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            assert.isString('ownerAddress', ownerAddress);
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getBalance(address,bytes)', [ownerAddress,
        assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getBalance(address,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public ERC20_PROXY_ID = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('ERC20_PROXY_ID()', []);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('ERC20_PROXY_ID()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public decodeERC20AssetData = {
        async callAsync(
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string]
        > {
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeERC20AssetData(bytes)', [assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('decodeERC20AssetData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public decodeERC1155AssetData = {
        async callAsync(
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, BigNumber[], BigNumber[], string]
        > {
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeERC1155AssetData(bytes)', [assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('decodeERC1155AssetData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string, BigNumber[], BigNumber[], string]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public ERC721_PROXY_ID = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('ERC721_PROXY_ID()', []);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('ERC721_PROXY_ID()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public encodeERC721AssetData = {
        async callAsync(
            tokenAddress: string,
            tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            assert.isString('tokenAddress', tokenAddress);
            assert.isBigNumber('tokenId', tokenId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('encodeERC721AssetData(address,uint256)', [tokenAddress,
        tokenId
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('encodeERC721AssetData(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public MULTI_ASSET_PROXY_ID = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('MULTI_ASSET_PROXY_ID()', []);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('MULTI_ASSET_PROXY_ID()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public encodeERC1155AssetData = {
        async callAsync(
            tokenAddress: string,
            tokenIds: BigNumber[],
            tokenValues: BigNumber[],
            callbackData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            assert.isString('tokenAddress', tokenAddress);
            assert.isArray('tokenIds', tokenIds);
            assert.isArray('tokenValues', tokenValues);
            assert.isString('callbackData', callbackData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('encodeERC1155AssetData(address,uint256[],uint256[],bytes)', [tokenAddress,
        tokenIds,
        tokenValues,
        callbackData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('encodeERC1155AssetData(address,uint256[],uint256[],bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getERC721TokenOwner = {
        async callAsync(
            tokenAddress: string,
            tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            assert.isString('tokenAddress', tokenAddress);
            assert.isBigNumber('tokenId', tokenId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getERC721TokenOwner(address,uint256)', [tokenAddress,
        tokenId
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getERC721TokenOwner(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public decodeMultiAssetData = {
        async callAsync(
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, BigNumber[], string[]]
        > {
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeMultiAssetData(bytes)', [assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('decodeMultiAssetData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, BigNumber[], string[]]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getBatchBalances = {
        async callAsync(
            ownerAddress: string,
            assetData: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber[]
        > {
            assert.isString('ownerAddress', ownerAddress);
            assert.isArray('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getBatchBalances(address,bytes[])', [ownerAddress,
        assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getBatchBalances(address,bytes[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getAssetProxyAllowance = {
        async callAsync(
            ownerAddress: string,
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            assert.isString('ownerAddress', ownerAddress);
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getAssetProxyAllowance(address,bytes)', [ownerAddress,
        assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getAssetProxyAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public encodeMultiAssetData = {
        async callAsync(
            amounts: BigNumber[],
            nestedAssetData: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            assert.isArray('amounts', amounts);
            assert.isArray('nestedAssetData', nestedAssetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('encodeMultiAssetData(uint256[],bytes[])', [amounts,
        nestedAssetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('encodeMultiAssetData(uint256[],bytes[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getOrderRelevantStates = {
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string;makerFeeAssetData: string;takerFeeAssetData: string}>,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[Array<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}>, BigNumber[], boolean[]]
        > {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[])', [orders,
        signatures
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[Array<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}>, BigNumber[], boolean[]]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getBatchBalancesAndAssetProxyAllowances = {
        async callAsync(
            ownerAddress: string,
            assetData: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber[], BigNumber[]]
        > {
            assert.isString('ownerAddress', ownerAddress);
            assert.isArray('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getBatchBalancesAndAssetProxyAllowances(address,bytes[])', [ownerAddress,
        assetData
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getBatchBalancesAndAssetProxyAllowances(address,bytes[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber[], BigNumber[]]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getOrderRelevantState = {
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string;makerFeeAssetData: string;takerFeeAssetData: string},
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}, BigNumber, boolean]
        > {
            
            assert.isString('signature', signature);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes)', [order,
        signature
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}, BigNumber, boolean]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
            _exchange: string,
    ): Promise<DevUtilsContract> {
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        if (artifact.compilerOutput === undefined) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return DevUtilsContract.deployAsync(bytecode, abi, provider, txDefaults, _exchange
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
            _exchange: string,
    ): Promise<DevUtilsContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchange
] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange
],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange
]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {data: txData},
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`DevUtils successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new DevUtilsContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_exchange
];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('DevUtils', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
