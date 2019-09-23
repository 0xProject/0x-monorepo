// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import { BaseContract, PromiseWithTransactionHash } from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
    BlockRange,
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
    /**
     * Decompose an ABI-encoded OrderStatusError.
     */
    public decodeOrderStatusError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns orderHash The order hash.orderStatus The order status.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, number]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeOrderStatusError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeOrderStatusError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, number]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeOrderStatusError(bytes)', [encoded]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeOrderStatusError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, number] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeOrderStatusError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, number]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decode ERC-721 asset data from the format described in the AssetProxy contract specification.
     */
    public decodeERC721AssetData = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param assetData AssetProxy-compliant asset data describing an ERC-721
         *     asset.
         * @returns The ERC-721 AssetProxy identifier, the address of the ERC-721 contract hosting this asset, and the identifier of the specific asset to be traded.
         */
        async callAsync(
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, BigNumber]> {
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeERC721AssetData(bytes)', [assetData]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeERC721AssetData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string, BigNumber]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetData AssetProxy-compliant asset data describing an ERC-721
         *     asset.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(assetData: string): string {
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeERC721AssetData(bytes)', [assetData]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeERC721AssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string, BigNumber] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeERC721AssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string, BigNumber]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Calls getBalance() and getAllowance() for assetData.
     */
    public getBalanceAndAssetProxyAllowance = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Details of asset, encoded per the AssetProxy contract
         *     specification.
         * @returns Number of assets (or asset baskets) held by owner, and number of assets (or asset baskets) that the corresponding AssetProxy is authorized to spend.
         */
        async callAsync(
            ownerAddress: string,
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber, BigNumber]> {
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getBalanceAndAssetProxyAllowance(address,bytes)', [
                ownerAddress.toLowerCase(),
                assetData,
            ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
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
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Details of asset, encoded per the AssetProxy contract
         *     specification.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(ownerAddress: string, assetData: string): string {
            assert.isString('ownerAddress', ownerAddress);
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getBalanceAndAssetProxyAllowance(address,bytes)',
                [ownerAddress.toLowerCase(), assetData],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBalanceAndAssetProxyAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [BigNumber, BigNumber] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBalanceAndAssetProxyAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded IncompleteFillError.
     */
    public decodeIncompleteFillError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns orderHash Hash of the order being filled.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[number, BigNumber, BigNumber]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeIncompleteFillError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeIncompleteFillError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[number, BigNumber, BigNumber]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeIncompleteFillError(bytes)', [
                encoded,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeIncompleteFillError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [number, BigNumber, BigNumber] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeIncompleteFillError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[number, BigNumber, BigNumber]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Gets the amount of an asset transferable by the owner.
     */
    public getTransferableAssetAmount = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param ownerAddress Address of the owner of the asset.
         * @param assetData Description of tokens, per the AssetProxy contract
         *     specification.
         * @returns The amount of the asset tranferable by the owner. NOTE: If the &#x60;assetData&#x60; encodes data for multiple assets, the &#x60;transferableAssetAmount&#x60; will represent the amount of times the entire &#x60;assetData&#x60; can be transferred. To calculate the total individual transferable amounts, this scaled &#x60;transferableAmount&#x60; must be multiplied by the individual asset amounts located within the &#x60;assetData&#x60;.
         */
        async callAsync(
            ownerAddress: string,
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getTransferableAssetAmount(address,bytes)', [
                ownerAddress.toLowerCase(),
                assetData,
            ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
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
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param ownerAddress Address of the owner of the asset.
         * @param assetData Description of tokens, per the AssetProxy contract
         *     specification.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(ownerAddress: string, assetData: string): string {
            assert.isString('ownerAddress', ownerAddress);
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getTransferableAssetAmount(address,bytes)', [
                ownerAddress.toLowerCase(),
                assetData,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getTransferableAssetAmount(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getTransferableAssetAmount(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded AssetProxyTransferError.
     */
    public decodeAssetProxyTransferError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns orderHash Hash of the order being dispatched.assetData Asset data of the order being dispatched.errorData ABI-encoded revert data from the asset proxy.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeAssetProxyTransferError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeAssetProxyTransferError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeAssetProxyTransferError(bytes)', [
                encoded,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeAssetProxyTransferError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeAssetProxyTransferError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded NegativeSpreadError.
     */
    public decodeNegativeSpreadError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns leftOrderHash Hash of the left order being matched.rightOrderHash Hash of the right order being matched.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeNegativeSpreadError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeNegativeSpreadError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeNegativeSpreadError(bytes)', [
                encoded,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeNegativeSpreadError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeNegativeSpreadError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded AssetProxyDispatchError.
     */
    public decodeAssetProxyDispatchError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns errorCode The error code.orderHash Hash of the order being dispatched.assetData Asset data of the order being dispatched.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[number, string, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeAssetProxyDispatchError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeAssetProxyDispatchError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[number, string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeAssetProxyDispatchError(bytes)', [
                encoded,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeAssetProxyDispatchError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [number, string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeAssetProxyDispatchError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[number, string, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded SignatureWalletError.
     */
    public decodeSignatureWalletError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns errorCode The error code.signerAddress The expected signer of the hash.signature The full signature bytes.errorData The revert data thrown by the validator contract.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, string, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeSignatureWalletError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeSignatureWalletError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string, string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeSignatureWalletError(bytes)', [
                encoded,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeSignatureWalletError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string, string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeSignatureWalletError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string, string, string]>(
                returnData,
            );
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded FillError.
     */
    public decodeFillError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns errorCode The error code.orderHash The order hash.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[number, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeFillError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeFillError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[number, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeFillError(bytes)', [encoded]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeFillError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [number, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeFillError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[number, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Calls getAssetProxyAllowance() for each element of assetData.
     */
    public getBatchAssetProxyAllowances = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Array of asset details, each encoded per the AssetProxy
         *     contract specification.
         * @returns An array of asset allowances from getAllowance(), with each element corresponding to the same-indexed element in the assetData input.
         */
        async callAsync(
            ownerAddress: string,
            assetData: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber[]> {
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getBatchAssetProxyAllowances(address,bytes[])', [
                ownerAddress.toLowerCase(),
                assetData,
            ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
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
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Array of asset details, each encoded per the AssetProxy
         *     contract specification.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(ownerAddress: string, assetData: string[]): string {
            assert.isString('ownerAddress', ownerAddress);
            assert.isArray('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getBatchAssetProxyAllowances(address,bytes[])',
                [ownerAddress.toLowerCase(), assetData],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBatchAssetProxyAllowances(address,bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber[] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBatchAssetProxyAllowances(address,bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber[]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Encode ERC-20 asset data into the format described in the AssetProxy contract specification.
     */
    public encodeERC20AssetData = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param tokenAddress The address of the ERC-20 contract hosting the asset to
         *     be traded.
         * @returns AssetProxy-compliant data describing the asset.
         */
        async callAsync(
            tokenAddress: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isString('tokenAddress', tokenAddress);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('encodeERC20AssetData(address)', [
                tokenAddress.toLowerCase(),
            ]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('encodeERC20AssetData(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param tokenAddress The address of the ERC-20 contract hosting the asset to
         *     be traded.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(tokenAddress: string): string {
            assert.isString('tokenAddress', tokenAddress);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('encodeERC20AssetData(address)', [
                tokenAddress.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC20AssetData(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC20AssetData(address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded OrderEpochError.
     */
    public decodeOrderEpochError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns makerAddress The order maker.orderSenderAddress The order sender.currentEpoch The current epoch for the maker.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, BigNumber]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeOrderEpochError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeOrderEpochError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string, BigNumber]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeOrderEpochError(bytes)', [encoded]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeOrderEpochError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string, BigNumber] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeOrderEpochError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string, BigNumber]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decodes the call data for an Exchange contract method call.
     */
    public decodeZeroExTransactionData = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param transactionData ABI-encoded calldata for an Exchange     contract
         *     method call.
         * @returns The name of the function called, and the parameters it was     given.  For single-order fills and cancels, the arrays will have     just one element.
         */
        async callAsync(
            transactionData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<
            [
                string,
                Array<{
                    makerAddress: string;
                    takerAddress: string;
                    feeRecipientAddress: string;
                    senderAddress: string;
                    makerAssetAmount: BigNumber;
                    takerAssetAmount: BigNumber;
                    makerFee: BigNumber;
                    takerFee: BigNumber;
                    expirationTimeSeconds: BigNumber;
                    salt: BigNumber;
                    makerAssetData: string;
                    takerAssetData: string;
                    makerFeeAssetData: string;
                    takerFeeAssetData: string;
                }>,
                BigNumber[],
                string[]
            ]
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeZeroExTransactionData(bytes)', [transactionData]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeZeroExTransactionData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<
                [
                    string,
                    Array<{
                        makerAddress: string;
                        takerAddress: string;
                        feeRecipientAddress: string;
                        senderAddress: string;
                        makerAssetAmount: BigNumber;
                        takerAssetAmount: BigNumber;
                        makerFee: BigNumber;
                        takerFee: BigNumber;
                        expirationTimeSeconds: BigNumber;
                        salt: BigNumber;
                        makerAssetData: string;
                        takerAssetData: string;
                        makerFeeAssetData: string;
                        takerFeeAssetData: string;
                    }>,
                    BigNumber[],
                    string[]
                ]
            >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param transactionData ABI-encoded calldata for an Exchange     contract
         *     method call.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(transactionData: string): string {
            assert.isString('transactionData', transactionData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeZeroExTransactionData(bytes)', [
                transactionData,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeZeroExTransactionData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(
            returnData: string,
        ): [
            string,
            Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            BigNumber[],
            string[]
        ] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeZeroExTransactionData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<
                [
                    string,
                    Array<{
                        makerAddress: string;
                        takerAddress: string;
                        feeRecipientAddress: string;
                        senderAddress: string;
                        makerAssetAmount: BigNumber;
                        takerAssetAmount: BigNumber;
                        makerFee: BigNumber;
                        takerFee: BigNumber;
                        expirationTimeSeconds: BigNumber;
                        salt: BigNumber;
                        makerAssetData: string;
                        takerAssetData: string;
                        makerFeeAssetData: string;
                        takerFeeAssetData: string;
                    }>,
                    BigNumber[],
                    string[]
                ]
            >(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded AssetProxyExistsError.
     */
    public decodeAssetProxyExistsError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns assetProxyId Id of asset proxy.assetProxyAddress The address of the asset proxy.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeAssetProxyExistsError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeAssetProxyExistsError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeAssetProxyExistsError(bytes)', [
                encoded,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeAssetProxyExistsError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeAssetProxyExistsError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded SignatureValidatorNotApprovedError.
     */
    public decodeSignatureValidatorNotApprovedError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns signerAddress The expected signer of the hash.validatorAddress The expected validator.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeSignatureValidatorNotApprovedError(bytes)', [
                encoded,
            ]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeSignatureValidatorNotApprovedError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'decodeSignatureValidatorNotApprovedError(bytes)',
                [encoded],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeSignatureValidatorNotApprovedError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeSignatureValidatorNotApprovedError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Returns the owner's balance of the assets(s) specified in assetData.  When the asset data contains multiple assets (eg in ERC1155 or Multi-Asset), the return value indicates how many complete "baskets" of those assets are owned by owner.
     */
    public getBalance = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Details of asset, encoded per the AssetProxy contract
         *     specification.
         * @returns Number of assets (or asset baskets) held by owner.
         */
        async callAsync(
            ownerAddress: string,
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getBalance(address,bytes)', [
                ownerAddress.toLowerCase(),
                assetData,
            ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
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
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Details of asset, encoded per the AssetProxy contract
         *     specification.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(ownerAddress: string, assetData: string): string {
            assert.isString('ownerAddress', ownerAddress);
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getBalance(address,bytes)', [
                ownerAddress.toLowerCase(),
                assetData,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBalance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBalance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decode ERC-20 asset data from the format described in the AssetProxy contract specification.
     */
    public decodeERC20AssetData = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param assetData AssetProxy-compliant asset data describing an ERC-20 asset.
         * @returns The ERC-20 AssetProxy identifier, and the address of the ERC-20  contract hosting this asset.
         */
        async callAsync(
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string]> {
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeERC20AssetData(bytes)', [assetData]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeERC20AssetData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetData AssetProxy-compliant asset data describing an ERC-20 asset.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(assetData: string): string {
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeERC20AssetData(bytes)', [assetData]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeERC20AssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeERC20AssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded SignatureError.
     */
    public decodeSignatureError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns errorCode The error code.signerAddress The expected signer of the hash.signature The full signature.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[number, string, string, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeSignatureError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeSignatureError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[number, string, string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeSignatureError(bytes)', [encoded]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeSignatureError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [number, string, string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeSignatureError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[number, string, string, string]>(
                returnData,
            );
            return abiDecodedReturnData;
        },
    };
    /**
     * Decode ERC-1155 asset data from the format described in the AssetProxy contract specification.
     */
    public decodeERC1155AssetData = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param assetData AssetProxy-compliant asset data describing an ERC-1155 set
         *     of assets.
         * @returns The ERC-1155 AssetProxy identifier, the address of the ERC-1155 contract hosting the assets, an array of the identifiers of the assets to be traded, an array of asset amounts to be traded, and callback data.  Each element of the arrays corresponds to the same-indexed element of the other array.  Return values specified as &#x60;memory&#x60; are returned as pointers to locations within the memory of the input parameter &#x60;assetData&#x60;.
         */
        async callAsync(
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, BigNumber[], BigNumber[], string]> {
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeERC1155AssetData(bytes)', [assetData]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeERC1155AssetData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string, BigNumber[], BigNumber[], string]>(
                rawCallResult,
            );
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetData AssetProxy-compliant asset data describing an ERC-1155 set
         *     of assets.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(assetData: string): string {
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeERC1155AssetData(bytes)', [assetData]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeERC1155AssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string, BigNumber[], BigNumber[], string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeERC1155AssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<
                [string, string, BigNumber[], BigNumber[], string]
            >(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Batch fetches ETH balances
     */
    public getEthBalances = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param addresses Array of addresses.
         * @returns Array of ETH balances.
         */
        async callAsync(
            addresses: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber[]> {
            assert.isArray('addresses', addresses);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getEthBalances(address[])', [addresses]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getEthBalances(address[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param addresses Array of addresses.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(addresses: string[]): string {
            assert.isArray('addresses', addresses);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getEthBalances(address[])', [addresses]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string[] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getEthBalances(address[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string[]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber[] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getEthBalances(address[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber[]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Simulates all of the transfers for each given order and returns the indices of each first failed transfer.
     */
    public getSimulatedOrdersTransferResults = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of orders to individually simulate transfers for.
         * @param takerAddresses Array of addresses of takers that will fill each
         *     order.
         * @param takerAssetFillAmounts Array of amounts of takerAsset that will be
         *     filled for each order.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            takerAddresses: string[],
            takerAssetFillAmounts: BigNumber[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isArray('takerAddresses', takerAddresses);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments(
                'getSimulatedOrdersTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],address[],uint256[])',
                [orders, takerAddresses, takerAssetFillAmounts],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.getSimulatedOrdersTransferResults.estimateGasAsync.bind(
                    self,
                    orders,
                    takerAddresses,
                    takerAssetFillAmounts,
                ),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param orders Array of orders to individually simulate transfers for.
         * @param takerAddresses Array of addresses of takers that will fill each
         *     order.
         * @param takerAssetFillAmounts Array of amounts of takerAsset that will be
         *     filled for each order.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            takerAddresses: string[],
            takerAssetFillAmounts: BigNumber[],
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isArray('takerAddresses', takerAddresses);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            const self = (this as any) as DevUtilsContract;
            const txHashPromise = self.getSimulatedOrdersTransferResults.sendTransactionAsync(
                orders,
                takerAddresses,
                takerAssetFillAmounts,
                txData,
            );
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of orders to individually simulate transfers for.
         * @param takerAddresses Array of addresses of takers that will fill each
         *     order.
         * @param takerAssetFillAmounts Array of amounts of takerAsset that will be
         *     filled for each order.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            takerAddresses: string[],
            takerAssetFillAmounts: BigNumber[],
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isArray('takerAddresses', takerAddresses);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments(
                'getSimulatedOrdersTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],address[],uint256[])',
                [orders, takerAddresses, takerAssetFillAmounts],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        async validateAndSendTransactionAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            takerAddresses: string[],
            takerAssetFillAmounts: BigNumber[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).getSimulatedOrdersTransferResults.callAsync(
                orders,
                takerAddresses,
                takerAssetFillAmounts,
                txData,
            );
            const txHash = await (this as any).getSimulatedOrdersTransferResults.sendTransactionAsync(
                orders,
                takerAddresses,
                takerAssetFillAmounts,
                txData,
            );
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of orders to individually simulate transfers for.
         * @param takerAddresses Array of addresses of takers that will fill each
         *     order.
         * @param takerAssetFillAmounts Array of amounts of takerAsset that will be
         *     filled for each order.
         * @returns The indices of the first failed transfer (or 4 if all transfers are successful) for each order.
         */
        async callAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            takerAddresses: string[],
            takerAssetFillAmounts: BigNumber[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<number[]> {
            assert.isArray('orders', orders);
            assert.isArray('takerAddresses', takerAddresses);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments(
                'getSimulatedOrdersTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],address[],uint256[])',
                [orders, takerAddresses, takerAssetFillAmounts],
            );
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'getSimulatedOrdersTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],address[],uint256[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<number[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of orders to individually simulate transfers for.
         * @param takerAddresses Array of addresses of takers that will fill each
         *     order.
         * @param takerAssetFillAmounts Array of amounts of takerAsset that will be
         *     filled for each order.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            takerAddresses: string[],
            takerAssetFillAmounts: BigNumber[],
        ): string {
            assert.isArray('orders', orders);
            assert.isArray('takerAddresses', takerAddresses);
            assert.isArray('takerAssetFillAmounts', takerAssetFillAmounts);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getSimulatedOrdersTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],address[],uint256[])',
                [orders, takerAddresses, takerAssetFillAmounts],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(
            callData: string,
        ): Array<{
            makerAddress: string;
            takerAddress: string;
            feeRecipientAddress: string;
            senderAddress: string;
            makerAssetAmount: BigNumber;
            takerAssetAmount: BigNumber;
            makerFee: BigNumber;
            takerFee: BigNumber;
            expirationTimeSeconds: BigNumber;
            salt: BigNumber;
            makerAssetData: string;
            takerAssetData: string;
            makerFeeAssetData: string;
            takerFeeAssetData: string;
        }> {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getSimulatedOrdersTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],address[],uint256[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
                Array<{
                    makerAddress: string;
                    takerAddress: string;
                    feeRecipientAddress: string;
                    senderAddress: string;
                    makerAssetAmount: BigNumber;
                    takerAssetAmount: BigNumber;
                    makerFee: BigNumber;
                    takerFee: BigNumber;
                    expirationTimeSeconds: BigNumber;
                    salt: BigNumber;
                    makerAssetData: string;
                    takerAssetData: string;
                    makerFeeAssetData: string;
                    takerFeeAssetData: string;
                }>
            >(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): number[] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getSimulatedOrdersTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],address[],uint256[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<number[]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Encode ERC-721 asset data into the format described in the AssetProxy specification.
     */
    public encodeERC721AssetData = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param tokenAddress The address of the ERC-721 contract hosting the asset to
         *     be traded.
         * @param tokenId The identifier of the specific asset to be traded.
         * @returns AssetProxy-compliant asset data describing the asset.
         */
        async callAsync(
            tokenAddress: string,
            tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('encodeERC721AssetData(address,uint256)', [
                tokenAddress.toLowerCase(),
                tokenId,
            ]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('encodeERC721AssetData(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param tokenAddress The address of the ERC-721 contract hosting the asset to
         *     be traded.
         * @param tokenId The identifier of the specific asset to be traded.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(tokenAddress: string, tokenId: BigNumber): string {
            assert.isString('tokenAddress', tokenAddress);
            assert.isBigNumber('tokenId', tokenId);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('encodeERC721AssetData(address,uint256)', [
                tokenAddress.toLowerCase(),
                tokenId,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC721AssetData(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC721AssetData(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded SignatureValidatorError.
     */
    public decodeEIP1271SignatureError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns signerAddress The expected signer of the hash.signature The full signature bytes.errorData The revert data thrown by the validator contract.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, string, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeEIP1271SignatureError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeEIP1271SignatureError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string, string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeEIP1271SignatureError(bytes)', [
                encoded,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeEIP1271SignatureError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string, string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeEIP1271SignatureError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string, string, string]>(
                returnData,
            );
            return abiDecodedReturnData;
        },
    };
    /**
     * Encode ERC-1155 asset data into the format described in the AssetProxy contract specification.
     */
    public encodeERC1155AssetData = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param tokenAddress The address of the ERC-1155 contract hosting the
         *     asset(s) to be traded.
         * @param tokenIds The identifiers of the specific assets to be traded.
         * @param tokenValues The amounts of each asset to be traded.
         * @param callbackData Data to be passed to receiving contracts when a transfer
         *     is performed.
         * @returns AssetProxy-compliant asset data describing the set of assets.
         */
        async callAsync(
            tokenAddress: string,
            tokenIds: BigNumber[],
            tokenValues: BigNumber[],
            callbackData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments(
                'encodeERC1155AssetData(address,uint256[],uint256[],bytes)',
                [tokenAddress.toLowerCase(), tokenIds, tokenValues, callbackData],
            );
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('encodeERC1155AssetData(address,uint256[],uint256[],bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param tokenAddress The address of the ERC-1155 contract hosting the
         *     asset(s) to be traded.
         * @param tokenIds The identifiers of the specific assets to be traded.
         * @param tokenValues The amounts of each asset to be traded.
         * @param callbackData Data to be passed to receiving contracts when a transfer
         *     is performed.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(
            tokenAddress: string,
            tokenIds: BigNumber[],
            tokenValues: BigNumber[],
            callbackData: string,
        ): string {
            assert.isString('tokenAddress', tokenAddress);
            assert.isArray('tokenIds', tokenIds);
            assert.isArray('tokenValues', tokenValues);
            assert.isString('callbackData', callbackData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'encodeERC1155AssetData(address,uint256[],uint256[],bytes)',
                [tokenAddress.toLowerCase(), tokenIds, tokenValues, callbackData],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC1155AssetData(address,uint256[],uint256[],bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC1155AssetData(address,uint256[],uint256[],bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decode multi-asset data from the format described in the AssetProxy contract specification.
     */
    public decodeMultiAssetData = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param assetData AssetProxy-compliant data describing a multi-asset basket.
         * @returns The Multi-Asset AssetProxy identifier, an array of the amounts of the assets to be traded, and an array of the AssetProxy-compliant data describing each asset to be traded.  Each element of the arrays corresponds to the same-indexed element of the other array.
         */
        async callAsync(
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, BigNumber[], string[]]> {
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeMultiAssetData(bytes)', [assetData]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeMultiAssetData(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, BigNumber[], string[]]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetData AssetProxy-compliant data describing a multi-asset basket.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(assetData: string): string {
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeMultiAssetData(bytes)', [assetData]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeMultiAssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, BigNumber[], string[]] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeMultiAssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, BigNumber[], string[]]>(
                returnData,
            );
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded TransactionExecutionError.
     */
    public decodeTransactionExecutionError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns transactionHash Hash of the transaction.errorData Error thrown by exeucteTransaction().
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeTransactionExecutionError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeTransactionExecutionError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeTransactionExecutionError(bytes)', [
                encoded,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeTransactionExecutionError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeTransactionExecutionError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded TransactionError.
     */
    public decodeTransactionError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns errorCode The error code.transactionHash Hash of the transaction.
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[number, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeTransactionError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeTransactionError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[number, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeTransactionError(bytes)', [encoded]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeTransactionError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [number, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeTransactionError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[number, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Calls getBalance() for each element of assetData.
     */
    public getBatchBalances = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Array of asset details, each encoded per the AssetProxy
         *     contract specification.
         * @returns Array of asset balances from getBalance(), with each element corresponding to the same-indexed element in the assetData input.
         */
        async callAsync(
            ownerAddress: string,
            assetData: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber[]> {
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getBatchBalances(address,bytes[])', [
                ownerAddress.toLowerCase(),
                assetData,
            ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
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
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Array of asset details, each encoded per the AssetProxy
         *     contract specification.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(ownerAddress: string, assetData: string[]): string {
            assert.isString('ownerAddress', ownerAddress);
            assert.isArray('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getBatchBalances(address,bytes[])', [
                ownerAddress.toLowerCase(),
                assetData,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBatchBalances(address,bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber[] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBatchBalances(address,bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber[]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Returns the number of asset(s) (described by assetData) that the corresponding AssetProxy contract is authorized to spend.  When the asset data contains multiple assets (eg for Multi-Asset), the return value indicates how many complete "baskets" of those assets may be spent by all of the corresponding AssetProxy contracts.
     */
    public getAssetProxyAllowance = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Details of asset, encoded per the AssetProxy contract
         *     specification.
         * @returns Number of assets (or asset baskets) that the corresponding AssetProxy is authorized to spend.
         */
        async callAsync(
            ownerAddress: string,
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('getAssetProxyAllowance(address,bytes)', [
                ownerAddress.toLowerCase(),
                assetData,
            ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
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
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Details of asset, encoded per the AssetProxy contract
         *     specification.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(ownerAddress: string, assetData: string): string {
            assert.isString('ownerAddress', ownerAddress);
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getAssetProxyAllowance(address,bytes)', [
                ownerAddress.toLowerCase(),
                assetData,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getAssetProxyAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getAssetProxyAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Simulates all of the transfers within an order and returns the index of the first failed transfer.
     */
    public getSimulatedOrderTransferResults = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param order The order to simulate transfers for.
         * @param takerAddress The address of the taker that will fill the order.
         * @param takerAssetFillAmount The amount of takerAsset that the taker wished
         *     to fill.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            order: {
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            },
            takerAddress: string,
            takerAssetFillAmount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('takerAddress', takerAddress);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments(
                'getSimulatedOrderTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),address,uint256)',
                [order, takerAddress.toLowerCase(), takerAssetFillAmount],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.getSimulatedOrderTransferResults.estimateGasAsync.bind(
                    self,
                    order,
                    takerAddress.toLowerCase(),
                    takerAssetFillAmount,
                ),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param order The order to simulate transfers for.
         * @param takerAddress The address of the taker that will fill the order.
         * @param takerAssetFillAmount The amount of takerAsset that the taker wished
         *     to fill.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            order: {
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            },
            takerAddress: string,
            takerAssetFillAmount: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('takerAddress', takerAddress);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            const self = (this as any) as DevUtilsContract;
            const txHashPromise = self.getSimulatedOrderTransferResults.sendTransactionAsync(
                order,
                takerAddress.toLowerCase(),
                takerAssetFillAmount,
                txData,
            );
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param order The order to simulate transfers for.
         * @param takerAddress The address of the taker that will fill the order.
         * @param takerAssetFillAmount The amount of takerAsset that the taker wished
         *     to fill.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            order: {
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            },
            takerAddress: string,
            takerAssetFillAmount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('takerAddress', takerAddress);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments(
                'getSimulatedOrderTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),address,uint256)',
                [order, takerAddress.toLowerCase(), takerAssetFillAmount],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        async validateAndSendTransactionAsync(
            order: {
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            },
            takerAddress: string,
            takerAssetFillAmount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).getSimulatedOrderTransferResults.callAsync(
                order,
                takerAddress,
                takerAssetFillAmount,
                txData,
            );
            const txHash = await (this as any).getSimulatedOrderTransferResults.sendTransactionAsync(
                order,
                takerAddress,
                takerAssetFillAmount,
                txData,
            );
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param order The order to simulate transfers for.
         * @param takerAddress The address of the taker that will fill the order.
         * @param takerAssetFillAmount The amount of takerAsset that the taker wished
         *     to fill.
         * @returns The index of the first failed transfer (or 4 if all transfers are successful).
         */
        async callAsync(
            order: {
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            },
            takerAddress: string,
            takerAssetFillAmount: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<number> {
            assert.isString('takerAddress', takerAddress);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments(
                'getSimulatedOrderTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),address,uint256)',
                [order, takerAddress.toLowerCase(), takerAssetFillAmount],
            );
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'getSimulatedOrderTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),address,uint256)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<number>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param order The order to simulate transfers for.
         * @param takerAddress The address of the taker that will fill the order.
         * @param takerAssetFillAmount The amount of takerAsset that the taker wished
         *     to fill.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(
            order: {
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            },
            takerAddress: string,
            takerAssetFillAmount: BigNumber,
        ): string {
            assert.isString('takerAddress', takerAddress);
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getSimulatedOrderTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),address,uint256)',
                [order, takerAddress.toLowerCase(), takerAssetFillAmount],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(
            callData: string,
        ): {
            makerAddress: string;
            takerAddress: string;
            feeRecipientAddress: string;
            senderAddress: string;
            makerAssetAmount: BigNumber;
            takerAssetAmount: BigNumber;
            makerFee: BigNumber;
            takerFee: BigNumber;
            expirationTimeSeconds: BigNumber;
            salt: BigNumber;
            makerAssetData: string;
            takerAssetData: string;
            makerFeeAssetData: string;
            takerFeeAssetData: string;
        } {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getSimulatedOrderTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),address,uint256)',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): number {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getSimulatedOrderTransferResults((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),address,uint256)',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<number>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Encode data for multiple assets, per the AssetProxy contract specification.
     */
    public encodeMultiAssetData = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param amounts The amounts of each asset to be traded.
         * @param nestedAssetData AssetProxy-compliant data describing each asset to be
         *     traded.
         * @returns AssetProxy-compliant data describing the set of assets.
         */
        async callAsync(
            amounts: BigNumber[],
            nestedAssetData: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('encodeMultiAssetData(uint256[],bytes[])', [
                amounts,
                nestedAssetData,
            ]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('encodeMultiAssetData(uint256[],bytes[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param amounts The amounts of each asset to be traded.
         * @param nestedAssetData AssetProxy-compliant data describing each asset to be
         *     traded.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(amounts: BigNumber[], nestedAssetData: string[]): string {
            assert.isArray('amounts', amounts);
            assert.isArray('nestedAssetData', nestedAssetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('encodeMultiAssetData(uint256[],bytes[])', [
                amounts,
                nestedAssetData,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber[] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeMultiAssetData(uint256[],bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber[]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeMultiAssetData(uint256[],bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Fetches all order-relevant information needed to validate if the supplied orders are fillable.
     */
    public getOrderRelevantStates = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order structures.
         * @param signatures Array of signatures provided by makers that prove the
         *     authenticity of the orders. `0x01` can always be provided if a signature
         *     does not need to be validated.
         * @returns The ordersInfo (array of the hash, status, and &#x60;takerAssetAmount&#x60; already filled for each order), fillableTakerAssetAmounts (array of amounts for each order&#x27;s &#x60;takerAssetAmount&#x60; that is fillable given all on-chain state), and isValidSignature (array containing the validity of each provided signature). NOTE: If the &#x60;takerAssetData&#x60; encodes data for multiple assets, each element of &#x60;fillableTakerAssetAmounts&#x60; will represent a &quot;scaled&quot; amount, meaning it must be multiplied by all the individual asset amounts within the &#x60;takerAssetData&#x60; to get the final amount of each asset that can be filled.
         */
        async callAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<
            [
                Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>,
                BigNumber[],
                boolean[]
            ]
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments(
                'getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[])',
                [orders, signatures],
            );
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[])',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<
                [
                    Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>,
                    BigNumber[],
                    boolean[]
                ]
            >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order structures.
         * @param signatures Array of signatures provided by makers that prove the
         *     authenticity of the orders. `0x01` can always be provided if a signature
         *     does not need to be validated.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
        ): string {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[])',
                [orders, signatures],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(
            callData: string,
        ): [
            Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            string[]
        ] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
                [
                    Array<{
                        makerAddress: string;
                        takerAddress: string;
                        feeRecipientAddress: string;
                        senderAddress: string;
                        makerAssetAmount: BigNumber;
                        takerAssetAmount: BigNumber;
                        makerFee: BigNumber;
                        takerFee: BigNumber;
                        expirationTimeSeconds: BigNumber;
                        salt: BigNumber;
                        makerAssetData: string;
                        takerAssetData: string;
                        makerFeeAssetData: string;
                        takerFeeAssetData: string;
                    }>,
                    string[]
                ]
            >(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(
            returnData: string,
        ): [
            Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>,
            BigNumber[],
            boolean[]
        ] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<
                [
                    Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>,
                    BigNumber[],
                    boolean[]
                ]
            >(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Calls getBatchBalances() and getBatchAllowances() for each element of assetData.
     */
    public getBatchBalancesAndAssetProxyAllowances = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Array of asset details, each encoded per the AssetProxy
         *     contract specification.
         * @returns An array of asset balances from getBalance(), and an array of asset allowances from getAllowance(), with each element corresponding to the same-indexed element in the assetData input.
         */
        async callAsync(
            ownerAddress: string,
            assetData: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber[], BigNumber[]]> {
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments(
                'getBatchBalancesAndAssetProxyAllowances(address,bytes[])',
                [ownerAddress.toLowerCase(), assetData],
            );
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
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
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber[], BigNumber[]]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param ownerAddress Owner of the assets specified by assetData.
         * @param assetData Array of asset details, each encoded per the AssetProxy
         *     contract specification.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(ownerAddress: string, assetData: string[]): string {
            assert.isString('ownerAddress', ownerAddress);
            assert.isArray('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getBatchBalancesAndAssetProxyAllowances(address,bytes[])',
                [ownerAddress.toLowerCase(), assetData],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, string[]] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBatchBalancesAndAssetProxyAllowances(address,bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, string[]]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [BigNumber[], BigNumber[]] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBatchBalancesAndAssetProxyAllowances(address,bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[BigNumber[], BigNumber[]]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Fetches all order-relevant information needed to validate if the supplied order is fillable.
     */
    public getOrderRelevantState = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param order The order structure.
         * @param signature Signature provided by maker that proves the order's
         *     authenticity. `0x01` can always be provided if the signature does not
         *     need to be validated.
         * @returns The orderInfo (hash, status, and &#x60;takerAssetAmount&#x60; already filled for the given order), fillableTakerAssetAmount (amount of the order&#x27;s &#x60;takerAssetAmount&#x60; that is fillable given all on-chain state), and isValidSignature (validity of the provided signature). NOTE: If the &#x60;takerAssetData&#x60; encodes data for multiple assets, &#x60;fillableTakerAssetAmount&#x60; will represent a &quot;scaled&quot; amount, meaning it must be multiplied by all the individual asset amounts within the &#x60;takerAssetData&#x60; to get the final amount of each asset that can be filled.
         */
        async callAsync(
            order: {
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            },
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<
            [{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }, BigNumber, boolean]
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
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments(
                'getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes)',
                [order, signature],
            );
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<
                [{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }, BigNumber, boolean]
            >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param order The order structure.
         * @param signature Signature provided by maker that proves the order's
         *     authenticity. `0x01` can always be provided if the signature does not
         *     need to be validated.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(
            order: {
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            },
            signature: string,
        ): string {
            assert.isString('signature', signature);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes)',
                [order, signature],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(
            callData: string,
        ): [
            {
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            },
            string
        ] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
                [
                    {
                        makerAddress: string;
                        takerAddress: string;
                        feeRecipientAddress: string;
                        senderAddress: string;
                        makerAssetAmount: BigNumber;
                        takerAssetAmount: BigNumber;
                        makerFee: BigNumber;
                        takerFee: BigNumber;
                        expirationTimeSeconds: BigNumber;
                        salt: BigNumber;
                        makerAssetData: string;
                        takerAssetData: string;
                        makerFeeAssetData: string;
                        takerFeeAssetData: string;
                    },
                    string
                ]
            >(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(
            returnData: string,
        ): [{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }, BigNumber, boolean] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<
                [{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }, BigNumber, boolean]
            >(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Decompose an ABI-encoded OrderStatusError.
     */
    public decodeExchangeInvalidContextError = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param encoded ABI-encoded revert error.
         * @returns errorCode Error code that corresponds to invalid maker, taker, or sender.orderHash The order hash.contextAddress The maker, taker, or sender address
         */
        async callAsync(
            encoded: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[number, string, string]> {
            assert.isString('encoded', encoded);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('decodeExchangeInvalidContextError(bytes)', [encoded]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('decodeExchangeInvalidContextError(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[number, string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param encoded ABI-encoded revert error.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(encoded: string): string {
            assert.isString('encoded', encoded);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeExchangeInvalidContextError(bytes)', [
                encoded,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeExchangeInvalidContextError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [number, string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeExchangeInvalidContextError(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[number, string, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
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
        const logDecodeDependenciesAbiOnly: { [contractName: string]: ContractAbi } = {};
        if (Object.keys(logDecodeDependencies) !== undefined) {
            for (const key of Object.keys(logDecodeDependencies)) {
                logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
            }
        }
        return DevUtilsContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            _exchange,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
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
        [_exchange] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`DevUtils successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new DevUtilsContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [_exchange];
        return contractInstance;
    }

    /**
     * @returns      The contract ABI
     */
    public static ABI(): ContractAbi {
        const abi = [
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeOrderStatusError',
                outputs: [
                    {
                        name: 'orderHash',
                        type: 'bytes32',
                    },
                    {
                        name: 'orderStatus',
                        type: 'uint8',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'decodeERC721AssetData',
                outputs: [
                    {
                        name: 'assetProxyId',
                        type: 'bytes4',
                    },
                    {
                        name: 'tokenAddress',
                        type: 'address',
                    },
                    {
                        name: 'tokenId',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'ownerAddress',
                        type: 'address',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'getBalanceAndAssetProxyAllowance',
                outputs: [
                    {
                        name: 'balance',
                        type: 'uint256',
                    },
                    {
                        name: 'allowance',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeIncompleteFillError',
                outputs: [
                    {
                        name: 'errorCode',
                        type: 'uint8',
                    },
                    {
                        name: 'expectedAssetFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'actualAssetFillAmount',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'ownerAddress',
                        type: 'address',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'getTransferableAssetAmount',
                outputs: [
                    {
                        name: 'transferableAssetAmount',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeAssetProxyTransferError',
                outputs: [
                    {
                        name: 'orderHash',
                        type: 'bytes32',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                    {
                        name: 'errorData',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeNegativeSpreadError',
                outputs: [
                    {
                        name: 'leftOrderHash',
                        type: 'bytes32',
                    },
                    {
                        name: 'rightOrderHash',
                        type: 'bytes32',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeAssetProxyDispatchError',
                outputs: [
                    {
                        name: 'errorCode',
                        type: 'uint8',
                    },
                    {
                        name: 'orderHash',
                        type: 'bytes32',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeSignatureWalletError',
                outputs: [
                    {
                        name: 'hash',
                        type: 'bytes32',
                    },
                    {
                        name: 'signerAddress',
                        type: 'address',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                    {
                        name: 'errorData',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeFillError',
                outputs: [
                    {
                        name: 'errorCode',
                        type: 'uint8',
                    },
                    {
                        name: 'orderHash',
                        type: 'bytes32',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'ownerAddress',
                        type: 'address',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes[]',
                    },
                ],
                name: 'getBatchAssetProxyAllowances',
                outputs: [
                    {
                        name: 'allowances',
                        type: 'uint256[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'tokenAddress',
                        type: 'address',
                    },
                ],
                name: 'encodeERC20AssetData',
                outputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeOrderEpochError',
                outputs: [
                    {
                        name: 'makerAddress',
                        type: 'address',
                    },
                    {
                        name: 'orderSenderAddress',
                        type: 'address',
                    },
                    {
                        name: 'currentEpoch',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'transactionData',
                        type: 'bytes',
                    },
                ],
                name: 'decodeZeroExTransactionData',
                outputs: [
                    {
                        name: 'functionName',
                        type: 'string',
                    },
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'takerAssetFillAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeAssetProxyExistsError',
                outputs: [
                    {
                        name: 'assetProxyId',
                        type: 'bytes4',
                    },
                    {
                        name: 'assetProxyAddress',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeSignatureValidatorNotApprovedError',
                outputs: [
                    {
                        name: 'signerAddress',
                        type: 'address',
                    },
                    {
                        name: 'validatorAddress',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'ownerAddress',
                        type: 'address',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'getBalance',
                outputs: [
                    {
                        name: 'balance',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'decodeERC20AssetData',
                outputs: [
                    {
                        name: 'assetProxyId',
                        type: 'bytes4',
                    },
                    {
                        name: 'tokenAddress',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeSignatureError',
                outputs: [
                    {
                        name: 'errorCode',
                        type: 'uint8',
                    },
                    {
                        name: 'hash',
                        type: 'bytes32',
                    },
                    {
                        name: 'signerAddress',
                        type: 'address',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'decodeERC1155AssetData',
                outputs: [
                    {
                        name: 'assetProxyId',
                        type: 'bytes4',
                    },
                    {
                        name: 'tokenAddress',
                        type: 'address',
                    },
                    {
                        name: 'tokenIds',
                        type: 'uint256[]',
                    },
                    {
                        name: 'tokenValues',
                        type: 'uint256[]',
                    },
                    {
                        name: 'callbackData',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'addresses',
                        type: 'address[]',
                    },
                ],
                name: 'getEthBalances',
                outputs: [
                    {
                        name: '',
                        type: 'uint256[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'takerAddresses',
                        type: 'address[]',
                    },
                    {
                        name: 'takerAssetFillAmounts',
                        type: 'uint256[]',
                    },
                ],
                name: 'getSimulatedOrdersTransferResults',
                outputs: [
                    {
                        name: 'orderTransferResults',
                        type: 'uint8[]',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'tokenAddress',
                        type: 'address',
                    },
                    {
                        name: 'tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'encodeERC721AssetData',
                outputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeEIP1271SignatureError',
                outputs: [
                    {
                        name: 'verifyingContractAddress',
                        type: 'address',
                    },
                    {
                        name: 'data',
                        type: 'bytes',
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                    {
                        name: 'errorData',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'tokenAddress',
                        type: 'address',
                    },
                    {
                        name: 'tokenIds',
                        type: 'uint256[]',
                    },
                    {
                        name: 'tokenValues',
                        type: 'uint256[]',
                    },
                    {
                        name: 'callbackData',
                        type: 'bytes',
                    },
                ],
                name: 'encodeERC1155AssetData',
                outputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'decodeMultiAssetData',
                outputs: [
                    {
                        name: 'assetProxyId',
                        type: 'bytes4',
                    },
                    {
                        name: 'amounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'nestedAssetData',
                        type: 'bytes[]',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeTransactionExecutionError',
                outputs: [
                    {
                        name: 'transactionHash',
                        type: 'bytes32',
                    },
                    {
                        name: 'errorData',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeTransactionError',
                outputs: [
                    {
                        name: 'errorCode',
                        type: 'uint8',
                    },
                    {
                        name: 'transactionHash',
                        type: 'bytes32',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'ownerAddress',
                        type: 'address',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes[]',
                    },
                ],
                name: 'getBatchBalances',
                outputs: [
                    {
                        name: 'balances',
                        type: 'uint256[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'ownerAddress',
                        type: 'address',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'getAssetProxyAllowance',
                outputs: [
                    {
                        name: 'allowance',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'order',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'takerAddress',
                        type: 'address',
                    },
                    {
                        name: 'takerAssetFillAmount',
                        type: 'uint256',
                    },
                ],
                name: 'getSimulatedOrderTransferResults',
                outputs: [
                    {
                        name: 'orderTransferResults',
                        type: 'uint8',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'amounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'nestedAssetData',
                        type: 'bytes[]',
                    },
                ],
                name: 'encodeMultiAssetData',
                outputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                ],
                name: 'getOrderRelevantStates',
                outputs: [
                    {
                        name: 'ordersInfo',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'orderStatus',
                                type: 'uint8',
                            },
                            {
                                name: 'orderHash',
                                type: 'bytes32',
                            },
                            {
                                name: 'orderTakerAssetFilledAmount',
                                type: 'uint256',
                            },
                        ],
                    },
                    {
                        name: 'fillableTakerAssetAmounts',
                        type: 'uint256[]',
                    },
                    {
                        name: 'isValidSignature',
                        type: 'bool[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'ownerAddress',
                        type: 'address',
                    },
                    {
                        name: 'assetData',
                        type: 'bytes[]',
                    },
                ],
                name: 'getBatchBalancesAndAssetProxyAllowances',
                outputs: [
                    {
                        name: 'balances',
                        type: 'uint256[]',
                    },
                    {
                        name: 'allowances',
                        type: 'uint256[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'order',
                        type: 'tuple',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'signature',
                        type: 'bytes',
                    },
                ],
                name: 'getOrderRelevantState',
                outputs: [
                    {
                        name: 'orderInfo',
                        type: 'tuple',
                        components: [
                            {
                                name: 'orderStatus',
                                type: 'uint8',
                            },
                            {
                                name: 'orderHash',
                                type: 'bytes32',
                            },
                            {
                                name: 'orderTakerAssetFilledAmount',
                                type: 'uint256',
                            },
                        ],
                    },
                    {
                        name: 'fillableTakerAssetAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'isValidSignature',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'encoded',
                        type: 'bytes',
                    },
                ],
                name: 'decodeExchangeInvalidContextError',
                outputs: [
                    {
                        name: 'errorCode',
                        type: 'uint8',
                    },
                    {
                        name: 'orderHash',
                        type: 'bytes32',
                    },
                    {
                        name: 'contextAddress',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                inputs: [
                    {
                        name: '_exchange',
                        type: 'address',
                    },
                ],
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor',
            },
        ] as ContractAbi;
        return abi;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
    ) {
        super('DevUtils', DevUtilsContract.ABI(), address, supportedProvider, txDefaults, logDecodeDependencies);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
