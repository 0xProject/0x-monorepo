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

            const rawCallResult = await self.evmExecAsync(encodedDataBytes);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
         */
        getABIEncodedTransactionData(assetData: string): string {
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeERC721AssetData(bytes)', [assetData]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): [string, string, BigNumber] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeERC721AssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, string, BigNumber]>(callData);
            return abiDecodedCallData;
        },
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): [BigNumber, BigNumber] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBalanceAndAssetProxyAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[BigNumber, BigNumber]>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): [BigNumber, BigNumber] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBalanceAndAssetProxyAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber]>(returnData);
            return abiDecodedReturnData;
        },
    };
    public ERC1155_PROXY_ID = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('ERC1155_PROXY_ID()', []);
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('ERC1155_PROXY_ID()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ERC1155_PROXY_ID()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('ERC1155_PROXY_ID()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('ERC1155_PROXY_ID()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
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
         * @returns The amount of the asset tranferable by the owner. NOTE: If the &#x60;assetData&#x60; encodes data for multiple assets, the &#x60;transferableAssetAmount&#x60; will represent the amount of times the entire &#x60;assetData&#x60; can be transferred. To calculate the total individual transferable amounts, this scaled &#x60;transferableAmount&#x60; must be multiplied by  the individual asset amounts located within the &#x60;assetData&#x60;.
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getTransferableAssetAmount(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getTransferableAssetAmount(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): BigNumber[] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBatchAssetProxyAllowances(address,bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber[]>(callData);
            return abiDecodedCallData;
        },
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

            const rawCallResult = await self.evmExecAsync(encodedDataBytes);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
         */
        getABIEncodedTransactionData(tokenAddress: string): string {
            assert.isString('tokenAddress', tokenAddress);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('encodeERC20AssetData(address)', [
                tokenAddress.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC20AssetData(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC20AssetData(address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
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

            const rawCallResult = await self.evmExecAsync(encodedDataBytes);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
         */
        getABIEncodedTransactionData(transactionData: string): string {
            assert.isString('transactionData', transactionData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeZeroExTransactionData(bytes)', [
                transactionData,
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
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
            }>,
            BigNumber[],
            string[]
        ] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeZeroExTransactionData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
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
                    }>,
                    BigNumber[],
                    string[]
                ]
            >(callData);
            return abiDecodedCallData;
        },
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
                    }>,
                    BigNumber[],
                    string[]
                ]
            >(returnData);
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBalance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBalance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
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
                'getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[])',
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[])',
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
            }>,
            signatures: string[],
        ): string {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[])',
                [orders, signatures],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): [
            Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>,
            BigNumber[],
            boolean[]
        ] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[])',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
                [
                    Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>,
                    BigNumber[],
                    boolean[]
                ]
            >(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): [
            Array<{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }>,
            BigNumber[],
            boolean[]
        ] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantStates((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes[])',
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
    public ERC20_PROXY_ID = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('ERC20_PROXY_ID()', []);
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('ERC20_PROXY_ID()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ERC20_PROXY_ID()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('ERC20_PROXY_ID()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('ERC20_PROXY_ID()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
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

            const rawCallResult = await self.evmExecAsync(encodedDataBytes);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
         */
        getABIEncodedTransactionData(assetData: string): string {
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeERC20AssetData(bytes)', [assetData]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): [string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeERC20AssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, string]>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): [string, string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeERC20AssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string]>(returnData);
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
                'getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes)',
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes)',
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
            },
            signature: string,
        ): string {
            assert.isString('signature', signature);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes)',
                [order, signature],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(
            callData: string,
        ): [{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }, BigNumber, boolean] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
                [{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }, BigNumber, boolean]
            >(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(
            returnData: string,
        ): [{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }, BigNumber, boolean] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder(
                'getOrderRelevantState((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<
                [{ orderStatus: number; orderHash: string; orderTakerAssetFilledAmount: BigNumber }, BigNumber, boolean]
            >(returnData);
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

            const rawCallResult = await self.evmExecAsync(encodedDataBytes);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
         */
        getABIEncodedTransactionData(assetData: string): string {
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeERC1155AssetData(bytes)', [assetData]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): [string, string, BigNumber[], BigNumber[], string] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeERC1155AssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, string, BigNumber[], BigNumber[], string]>(
                callData,
            );
            return abiDecodedCallData;
        },
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
         */
        getABIEncodedTransactionData(addresses: string[]): string {
            assert.isArray('addresses', addresses);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getEthBalances(address[])', [addresses]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): BigNumber[] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getEthBalances(address[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber[]>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): BigNumber[] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getEthBalances(address[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber[]>(returnData);
            return abiDecodedReturnData;
        },
    };
    public ERC721_PROXY_ID = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('ERC721_PROXY_ID()', []);
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('ERC721_PROXY_ID()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ERC721_PROXY_ID()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('ERC721_PROXY_ID()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('ERC721_PROXY_ID()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
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

            const rawCallResult = await self.evmExecAsync(encodedDataBytes);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC721AssetData(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC721AssetData(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public MULTI_ASSET_PROXY_ID = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('MULTI_ASSET_PROXY_ID()', []);
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('MULTI_ASSET_PROXY_ID()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('MULTI_ASSET_PROXY_ID()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('MULTI_ASSET_PROXY_ID()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('MULTI_ASSET_PROXY_ID()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
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

            const rawCallResult = await self.evmExecAsync(encodedDataBytes);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC1155AssetData(address,uint256[],uint256[],bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeERC1155AssetData(address,uint256[],uint256[],bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Calls `asset.ownerOf(tokenId)`, but returns a null owner instead of reverting on an unowned asset.
     */
    public getERC721TokenOwner = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param tokenAddress Address of ERC721 asset.
         * @param tokenId The identifier for the specific NFT.
         * @returns Owner of tokenId or null address if unowned.
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
            const encodedData = self._strictEncodeArguments('getERC721TokenOwner(address,uint256)', [
                tokenAddress.toLowerCase(),
                tokenId,
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getERC721TokenOwner(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param tokenAddress Address of ERC721 asset.
         * @param tokenId The identifier for the specific NFT.
         */
        getABIEncodedTransactionData(tokenAddress: string, tokenId: BigNumber): string {
            assert.isString('tokenAddress', tokenAddress);
            assert.isBigNumber('tokenId', tokenId);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getERC721TokenOwner(address,uint256)', [
                tokenAddress.toLowerCase(),
                tokenId,
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getERC721TokenOwner(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getERC721TokenOwner(address,uint256)');
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

            const rawCallResult = await self.evmExecAsync(encodedDataBytes);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
         */
        getABIEncodedTransactionData(assetData: string): string {
            assert.isString('assetData', assetData);
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('decodeMultiAssetData(bytes)', [assetData]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): [string, BigNumber[], string[]] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('decodeMultiAssetData(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, BigNumber[], string[]]>(callData);
            return abiDecodedCallData;
        },
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): BigNumber[] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBatchBalances(address,bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber[]>(callData);
            return abiDecodedCallData;
        },
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getAssetProxyAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getAssetProxyAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
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

            const rawCallResult = await self.evmExecAsync(encodedDataBytes);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeMultiAssetData(uint256[],bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('encodeMultiAssetData(uint256[],bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public STATIC_CALL_PROXY_ID = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as DevUtilsContract;
            const encodedData = self._strictEncodeArguments('STATIC_CALL_PROXY_ID()', []);
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('STATIC_CALL_PROXY_ID()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('STATIC_CALL_PROXY_ID()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('STATIC_CALL_PROXY_ID()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('STATIC_CALL_PROXY_ID()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): [BigNumber[], BigNumber[]] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBatchBalancesAndAssetProxyAllowances(address,bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[BigNumber[], BigNumber[]]>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): [BigNumber[], BigNumber[]] {
            const self = (this as any) as DevUtilsContract;
            const abiEncoder = self._lookupAbiEncoder('getBatchBalancesAndAssetProxyAllowances(address,bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[BigNumber[], BigNumber[]]>(returnData);
            return abiDecodedReturnData;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        _exchange: string,
        _zrxAssetData: string,
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
            _zrxAssetData,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        _exchange: string,
        _zrxAssetData: string,
    ): Promise<DevUtilsContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchange, _zrxAssetData] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange, _zrxAssetData],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange, _zrxAssetData]);
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
        contractInstance.constructorArgs = [_exchange, _zrxAssetData];
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
                inputs: [],
                name: 'ERC1155_PROXY_ID',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
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
                inputs: [],
                name: 'ERC20_PROXY_ID',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
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
                constant: true,
                inputs: [],
                name: 'ERC721_PROXY_ID',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
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
                inputs: [],
                name: 'MULTI_ASSET_PROXY_ID',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
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
                        name: 'tokenAddress',
                        type: 'address',
                    },
                    {
                        name: 'tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'getERC721TokenOwner',
                outputs: [
                    {
                        name: 'ownerAddress',
                        type: 'address',
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
                inputs: [],
                name: 'STATIC_CALL_PROXY_ID',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
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
                inputs: [
                    {
                        name: '_exchange',
                        type: 'address',
                    },
                    {
                        name: '_zrxAssetData',
                        type: 'bytes',
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
