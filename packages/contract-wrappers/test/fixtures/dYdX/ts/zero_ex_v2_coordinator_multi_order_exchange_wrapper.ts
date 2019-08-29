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
export class ZeroExV2CoordinatorMultiOrderExchangeWrapperContract extends BaseContract {
    public isValidSignature = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @returns Magic value required for a successful &#x60;Wallet&#x60; signature validation in the 0x Exchange v2.1 contract.
         */
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isString('index_0', index_0);
            assert.isString('index_1', index_1);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('isValidSignature(bytes32,bytes)', [index_0, index_1]);
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
            const abiEncoder = self._lookupAbiEncoder('isValidSignature(bytes32,bytes)');
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
        getABIEncodedTransactionData(index_0: string, index_1: string): string {
            assert.isString('index_0', index_0);
            assert.isString('index_1', index_1);
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isValidSignature(bytes32,bytes)', [
                index_0,
                index_1,
            ]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('isValidSignature(bytes32,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('isValidSignature(bytes32,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Calculates the EIP712 hash of a 0x transaction using the domain separator of the Exchange contract.
     */
    public getTransactionHash = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param transaction 0x transaction containing salt, signerAddress, and data.
         * @returns EIP712 hash of the transaction with the domain separator of this contract.
         */
        async callAsync(
            transaction: { salt: BigNumber; signerAddress: string; data: string },
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('getTransactionHash((uint256,address,bytes))', [
                transaction,
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
            const abiEncoder = self._lookupAbiEncoder('getTransactionHash((uint256,address,bytes))');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param transaction 0x transaction containing salt, signerAddress, and data.
         */
        getABIEncodedTransactionData(transaction: { salt: BigNumber; signerAddress: string; data: string }): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getTransactionHash((uint256,address,bytes))',
                [transaction],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('getTransactionHash((uint256,address,bytes))');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('getTransactionHash((uint256,address,bytes))');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public getExchangeCost = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param makerToken Address of makerToken, the token to receive
         * @param takerToken Address of takerToken, the token to pay
         * @param desiredMakerToken Amount of makerToken requested
         * @param orderData Arbitrary bytes data for any information to pass to the
         *     exchange
         * @returns Amount of takerToken the needed to complete the exchange
         */
        async callAsync(
            makerToken: string,
            takerToken: string,
            desiredMakerToken: BigNumber,
            orderData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isString('makerToken', makerToken);
            assert.isString('takerToken', takerToken);
            assert.isBigNumber('desiredMakerToken', desiredMakerToken);
            assert.isString('orderData', orderData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('getExchangeCost(address,address,uint256,bytes)', [
                makerToken.toLowerCase(),
                takerToken.toLowerCase(),
                desiredMakerToken,
                orderData,
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
            const abiEncoder = self._lookupAbiEncoder('getExchangeCost(address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param makerToken Address of makerToken, the token to receive
         * @param takerToken Address of takerToken, the token to pay
         * @param desiredMakerToken Amount of makerToken requested
         * @param orderData Arbitrary bytes data for any information to pass to the
         *     exchange
         */
        getABIEncodedTransactionData(
            makerToken: string,
            takerToken: string,
            desiredMakerToken: BigNumber,
            orderData: string,
        ): string {
            assert.isString('makerToken', makerToken);
            assert.isString('takerToken', takerToken);
            assert.isBigNumber('desiredMakerToken', desiredMakerToken);
            assert.isString('orderData', orderData);
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'getExchangeCost(address,address,uint256,bytes)',
                [makerToken.toLowerCase(), takerToken.toLowerCase(), desiredMakerToken, orderData],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('getExchangeCost(address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('getExchangeCost(address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public ZERO_EX_EXCHANGE = {
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('ZERO_EX_EXCHANGE()', []);
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
            const abiEncoder = self._lookupAbiEncoder('ZERO_EX_EXCHANGE()');
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ZERO_EX_EXCHANGE()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('ZERO_EX_EXCHANGE()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('ZERO_EX_EXCHANGE()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public exchange = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param receiver Address to set allowance on once the trade has completed
         * @param makerToken Address of makerToken, the token to receive
         * @param takerToken Address of takerToken, the token to pay
         * @param requestedFillAmount Amount of takerToken being paid
         * @param orderData Arbitrary bytes data for any information to pass to the
         *     exchange
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            index_0: string,
            receiver: string,
            makerToken: string,
            takerToken: string,
            requestedFillAmount: BigNumber,
            orderData: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('index_0', index_0);
            assert.isString('receiver', receiver);
            assert.isString('makerToken', makerToken);
            assert.isString('takerToken', takerToken);
            assert.isBigNumber('requestedFillAmount', requestedFillAmount);
            assert.isString('orderData', orderData);
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('exchange(address,address,address,address,uint256,bytes)', [
                index_0.toLowerCase(),
                receiver.toLowerCase(),
                makerToken.toLowerCase(),
                takerToken.toLowerCase(),
                requestedFillAmount,
                orderData,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.exchange.estimateGasAsync.bind(
                    self,
                    index_0.toLowerCase(),
                    receiver.toLowerCase(),
                    makerToken.toLowerCase(),
                    takerToken.toLowerCase(),
                    requestedFillAmount,
                    orderData,
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
         * @param receiver Address to set allowance on once the trade has completed
         * @param makerToken Address of makerToken, the token to receive
         * @param takerToken Address of takerToken, the token to pay
         * @param requestedFillAmount Amount of takerToken being paid
         * @param orderData Arbitrary bytes data for any information to pass to the
         *     exchange
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            index_0: string,
            receiver: string,
            makerToken: string,
            takerToken: string,
            requestedFillAmount: BigNumber,
            orderData: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('index_0', index_0);
            assert.isString('receiver', receiver);
            assert.isString('makerToken', makerToken);
            assert.isString('takerToken', takerToken);
            assert.isBigNumber('requestedFillAmount', requestedFillAmount);
            assert.isString('orderData', orderData);
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const txHashPromise = self.exchange.sendTransactionAsync(
                index_0.toLowerCase(),
                receiver.toLowerCase(),
                makerToken.toLowerCase(),
                takerToken.toLowerCase(),
                requestedFillAmount,
                orderData,
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
         * @param receiver Address to set allowance on once the trade has completed
         * @param makerToken Address of makerToken, the token to receive
         * @param takerToken Address of takerToken, the token to pay
         * @param requestedFillAmount Amount of takerToken being paid
         * @param orderData Arbitrary bytes data for any information to pass to the
         *     exchange
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            index_0: string,
            receiver: string,
            makerToken: string,
            takerToken: string,
            requestedFillAmount: BigNumber,
            orderData: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('index_0', index_0);
            assert.isString('receiver', receiver);
            assert.isString('makerToken', makerToken);
            assert.isString('takerToken', takerToken);
            assert.isBigNumber('requestedFillAmount', requestedFillAmount);
            assert.isString('orderData', orderData);
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('exchange(address,address,address,address,uint256,bytes)', [
                index_0.toLowerCase(),
                receiver.toLowerCase(),
                makerToken.toLowerCase(),
                takerToken.toLowerCase(),
                requestedFillAmount,
                orderData,
            ]);
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
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param receiver Address to set allowance on once the trade has completed
         * @param makerToken Address of makerToken, the token to receive
         * @param takerToken Address of takerToken, the token to pay
         * @param requestedFillAmount Amount of takerToken being paid
         * @param orderData Arbitrary bytes data for any information to pass to the
         *     exchange
         * @returns The amount of makerToken received
         */
        async callAsync(
            index_0: string,
            receiver: string,
            makerToken: string,
            takerToken: string,
            requestedFillAmount: BigNumber,
            orderData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isString('index_0', index_0);
            assert.isString('receiver', receiver);
            assert.isString('makerToken', makerToken);
            assert.isString('takerToken', takerToken);
            assert.isBigNumber('requestedFillAmount', requestedFillAmount);
            assert.isString('orderData', orderData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('exchange(address,address,address,address,uint256,bytes)', [
                index_0.toLowerCase(),
                receiver.toLowerCase(),
                makerToken.toLowerCase(),
                takerToken.toLowerCase(),
                requestedFillAmount,
                orderData,
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
            const abiEncoder = self._lookupAbiEncoder('exchange(address,address,address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param receiver Address to set allowance on once the trade has completed
         * @param makerToken Address of makerToken, the token to receive
         * @param takerToken Address of takerToken, the token to pay
         * @param requestedFillAmount Amount of takerToken being paid
         * @param orderData Arbitrary bytes data for any information to pass to the
         *     exchange
         */
        getABIEncodedTransactionData(
            index_0: string,
            receiver: string,
            makerToken: string,
            takerToken: string,
            requestedFillAmount: BigNumber,
            orderData: string,
        ): string {
            assert.isString('index_0', index_0);
            assert.isString('receiver', receiver);
            assert.isString('makerToken', makerToken);
            assert.isString('takerToken', takerToken);
            assert.isBigNumber('requestedFillAmount', requestedFillAmount);
            assert.isString('orderData', orderData);
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'exchange(address,address,address,address,uint256,bytes)',
                [
                    index_0.toLowerCase(),
                    receiver.toLowerCase(),
                    makerToken.toLowerCase(),
                    takerToken.toLowerCase(),
                    requestedFillAmount,
                    orderData,
                ],
            );
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('exchange(address,address,address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('exchange(address,address,address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
        async validateAndSendTransactionAsync(
            index_0: string,
            receiver: string,
            makerToken: string,
            takerToken: string,
            requestedFillAmount: BigNumber,
            orderData: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).exchange.callAsync(
                index_0,
                receiver,
                makerToken,
                takerToken,
                requestedFillAmount,
                orderData,
                txData,
            );
            const txHash = await (this as any).exchange.sendTransactionAsync(
                index_0,
                receiver,
                makerToken,
                takerToken,
                requestedFillAmount,
                orderData,
                txData,
            );
            return txHash;
        },
    };
    public ZERO_EX_COORDINATOR = {
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('ZERO_EX_COORDINATOR()', []);
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
            const abiEncoder = self._lookupAbiEncoder('ZERO_EX_COORDINATOR()');
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ZERO_EX_COORDINATOR()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('ZERO_EX_COORDINATOR()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('ZERO_EX_COORDINATOR()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public EIP712_EXCHANGE_DOMAIN_HASH = {
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('EIP712_EXCHANGE_DOMAIN_HASH()', []);
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
            const abiEncoder = self._lookupAbiEncoder('EIP712_EXCHANGE_DOMAIN_HASH()');
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('EIP712_EXCHANGE_DOMAIN_HASH()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('EIP712_EXCHANGE_DOMAIN_HASH()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('EIP712_EXCHANGE_DOMAIN_HASH()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public ZERO_EX_TOKEN_PROXY = {
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('ZERO_EX_TOKEN_PROXY()', []);
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
            const abiEncoder = self._lookupAbiEncoder('ZERO_EX_TOKEN_PROXY()');
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ZERO_EX_TOKEN_PROXY()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('ZERO_EX_TOKEN_PROXY()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('ZERO_EX_TOKEN_PROXY()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public EIP712_DOMAIN_HASH = {
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('EIP712_DOMAIN_HASH()', []);
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
            const abiEncoder = self._lookupAbiEncoder('EIP712_DOMAIN_HASH()');
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('EIP712_DOMAIN_HASH()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('EIP712_DOMAIN_HASH()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('EIP712_DOMAIN_HASH()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public EIP712_COORDINATOR_DOMAIN_HASH = {
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const encodedData = self._strictEncodeArguments('EIP712_COORDINATOR_DOMAIN_HASH()', []);
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
            const abiEncoder = self._lookupAbiEncoder('EIP712_COORDINATOR_DOMAIN_HASH()');
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
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('EIP712_COORDINATOR_DOMAIN_HASH()', []);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('EIP712_COORDINATOR_DOMAIN_HASH()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ZeroExV2CoordinatorMultiOrderExchangeWrapperContract;
            const abiEncoder = self._lookupAbiEncoder('EIP712_COORDINATOR_DOMAIN_HASH()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        zeroExExchange: string,
        zeroExCoordinator: string,
        zeroExProxy: string,
    ): Promise<ZeroExV2CoordinatorMultiOrderExchangeWrapperContract> {
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
        return ZeroExV2CoordinatorMultiOrderExchangeWrapperContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            zeroExExchange,
            zeroExCoordinator,
            zeroExProxy,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        zeroExExchange: string,
        zeroExCoordinator: string,
        zeroExProxy: string,
    ): Promise<ZeroExV2CoordinatorMultiOrderExchangeWrapperContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [zeroExExchange, zeroExCoordinator, zeroExProxy] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [zeroExExchange, zeroExCoordinator, zeroExProxy],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [zeroExExchange, zeroExCoordinator, zeroExProxy]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(
            `ZeroExV2CoordinatorMultiOrderExchangeWrapper successfully deployed at ${txReceipt.contractAddress}`,
        );
        const contractInstance = new ZeroExV2CoordinatorMultiOrderExchangeWrapperContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [zeroExExchange, zeroExCoordinator, zeroExProxy];
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
                        name: 'index_0',
                        type: 'bytes32',
                    },
                    {
                        name: 'index_1',
                        type: 'bytes',
                    },
                ],
                name: 'isValidSignature',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
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
                        name: 'transaction',
                        type: 'tuple',
                        components: [
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'signerAddress',
                                type: 'address',
                            },
                            {
                                name: 'data',
                                type: 'bytes',
                            },
                        ],
                    },
                ],
                name: 'getTransactionHash',
                outputs: [
                    {
                        name: 'transactionHash',
                        type: 'bytes32',
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
                        name: 'makerToken',
                        type: 'address',
                    },
                    {
                        name: 'takerToken',
                        type: 'address',
                    },
                    {
                        name: 'desiredMakerToken',
                        type: 'uint256',
                    },
                    {
                        name: 'orderData',
                        type: 'bytes',
                    },
                ],
                name: 'getExchangeCost',
                outputs: [
                    {
                        name: '',
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
                name: 'ZERO_EX_EXCHANGE',
                outputs: [
                    {
                        name: '',
                        type: 'address',
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
                        name: 'index_0',
                        type: 'address',
                    },
                    {
                        name: 'receiver',
                        type: 'address',
                    },
                    {
                        name: 'makerToken',
                        type: 'address',
                    },
                    {
                        name: 'takerToken',
                        type: 'address',
                    },
                    {
                        name: 'requestedFillAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'orderData',
                        type: 'bytes',
                    },
                ],
                name: 'exchange',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'ZERO_EX_COORDINATOR',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'EIP712_EXCHANGE_DOMAIN_HASH',
                outputs: [
                    {
                        name: '',
                        type: 'bytes32',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'ZERO_EX_TOKEN_PROXY',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'EIP712_DOMAIN_HASH',
                outputs: [
                    {
                        name: '',
                        type: 'bytes32',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'EIP712_COORDINATOR_DOMAIN_HASH',
                outputs: [
                    {
                        name: '',
                        type: 'bytes32',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                inputs: [
                    {
                        name: 'zeroExExchange',
                        type: 'address',
                    },
                    {
                        name: 'zeroExCoordinator',
                        type: 'address',
                    },
                    {
                        name: 'zeroExProxy',
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
        super(
            'ZeroExV2CoordinatorMultiOrderExchangeWrapper',
            ZeroExV2CoordinatorMultiOrderExchangeWrapperContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
