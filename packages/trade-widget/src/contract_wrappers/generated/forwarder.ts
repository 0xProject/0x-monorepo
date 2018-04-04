/**
 * This file is auto-generated using abi-gen. Don't edit directly.
 * Templates can be found at https://github.com/0xProject/0x-monorepo/tree/development/packages/contract_templates.
 */
// tslint:disable:no-consecutive-blank-lines
// tslint:disable-next-line:no-unused-variable
import { BaseContract } from '@0xproject/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, DataItem, MethodAbi, TxData, TxDataPayable } from '@0xproject/types';
import { BigNumber, classUtils, promisify } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethersContracts from 'ethers-contracts';
import * as _ from 'lodash';


// tslint:disable:no-parameter-reassignment
export class ForwarderContract extends BaseContract {
    public isRoundingError = {
        async callAsync(
            numerator: BigNumber,
            denominator: BigNumber,
            target: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'isRoundingError'}) as MethodAbi).inputs;
            [numerator,
        denominator,
        target,
        ] = BaseContract._formatABIDataItemList(inputAbi, [numerator,
        denominator,
        target,
        ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.isRoundingError(
                numerator,
                denominator,
                target,
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'isRoundingError'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public isAcceptableThreshold = {
        async callAsync(
            requestedTokenAmount: BigNumber,
            soldTokenAmount: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'isAcceptableThreshold'}) as MethodAbi).inputs;
            [requestedTokenAmount,
        soldTokenAmount,
        ] = BaseContract._formatABIDataItemList(inputAbi, [requestedTokenAmount,
        soldTokenAmount,
        ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.isAcceptableThreshold(
                requestedTokenAmount,
                soldTokenAmount,
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'isAcceptableThreshold'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public marketBuyOrders = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            takerTokenFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'marketBuyOrders'}) as MethodAbi).inputs;
            [orders,
    takerTokenFillAmount,
    signatures,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerTokenFillAmount,
    signatures,
    ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.marketBuyOrders(
                orders,
                takerTokenFillAmount,
                signatures,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.marketBuyOrders.estimateGasAsync.bind(
                    self,
                    orders,
                    takerTokenFillAmount,
                    signatures,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            takerTokenFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'marketBuyOrders'}) as MethodAbi).inputs;
            [orders,
    takerTokenFillAmount,
    signatures,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerTokenFillAmount,
    signatures,
    ], BaseContract._bigNumberToString.bind(this));
            const encodedData = self._ethersInterface.functions.marketBuyOrders(
                orders,
                takerTokenFillAmount,
                signatures,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                }
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            takerTokenFillAmount: BigNumber,
            signatures: string[],
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'marketBuyOrders'}) as MethodAbi).inputs;
            [orders,
    takerTokenFillAmount,
    signatures,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerTokenFillAmount,
    signatures,
    ], BaseContract._bigNumberToString.bind(self));
            const abiEncodedTransactionData = self._ethersInterface.functions.marketBuyOrders(
                orders,
                takerTokenFillAmount,
                signatures,
            ).data
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            takerTokenFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{}
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'marketBuyOrders'}) as MethodAbi).inputs;
            [orders,
        takerTokenFillAmount,
        signatures,
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        takerTokenFillAmount,
        signatures,
        ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.marketBuyOrders(
                orders,
                takerTokenFillAmount,
                signatures,
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'marketBuyOrders'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public fillOrders = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            feeSignatures: string[],
            txData: Partial<TxDataPayable> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrders'}) as MethodAbi).inputs;
            [orders,
    signatures,
    feeOrders,
    feeSignatures,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    signatures,
    feeOrders,
    feeSignatures,
    ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.fillOrders(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.fillOrders.estimateGasAsync.bind(
                    self,
                    orders,
                    signatures,
                    feeOrders,
                    feeSignatures,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            feeSignatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrders'}) as MethodAbi).inputs;
            [orders,
    signatures,
    feeOrders,
    feeSignatures,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    signatures,
    feeOrders,
    feeSignatures,
    ], BaseContract._bigNumberToString.bind(this));
            const encodedData = self._ethersInterface.functions.fillOrders(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                }
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            feeSignatures: string[],
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrders'}) as MethodAbi).inputs;
            [orders,
    signatures,
    feeOrders,
    feeSignatures,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    signatures,
    feeOrders,
    feeSignatures,
    ], BaseContract._bigNumberToString.bind(self));
            const abiEncodedTransactionData = self._ethersInterface.functions.fillOrders(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
            ).data
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            feeSignatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{}
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrders'}) as MethodAbi).inputs;
            [orders,
        signatures,
        feeOrders,
        feeSignatures,
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        signatures,
        feeOrders,
        feeSignatures,
        ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.fillOrders(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'fillOrders'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public initialize = {
        async sendTransactionAsync(
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'initialize'}) as MethodAbi).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.initialize(
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.initialize.estimateGasAsync.bind(
                    self,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'initialize'}) as MethodAbi).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(this));
            const encodedData = self._ethersInterface.functions.initialize(
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                }
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'initialize'}) as MethodAbi).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const abiEncodedTransactionData = self._ethersInterface.functions.initialize(
            ).data
            return abiEncodedTransactionData;
        },
    };
    public marketSellOrders = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            takerTokenFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'marketSellOrders'}) as MethodAbi).inputs;
            [orders,
    takerTokenFillAmount,
    signatures,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerTokenFillAmount,
    signatures,
    ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.marketSellOrders(
                orders,
                takerTokenFillAmount,
                signatures,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.marketSellOrders.estimateGasAsync.bind(
                    self,
                    orders,
                    takerTokenFillAmount,
                    signatures,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            takerTokenFillAmount: BigNumber,
            signatures: string[],
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'marketSellOrders'}) as MethodAbi).inputs;
            [orders,
    takerTokenFillAmount,
    signatures,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerTokenFillAmount,
    signatures,
    ], BaseContract._bigNumberToString.bind(this));
            const encodedData = self._ethersInterface.functions.marketSellOrders(
                orders,
                takerTokenFillAmount,
                signatures,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                }
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            takerTokenFillAmount: BigNumber,
            signatures: string[],
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'marketSellOrders'}) as MethodAbi).inputs;
            [orders,
    takerTokenFillAmount,
    signatures,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    takerTokenFillAmount,
    signatures,
    ], BaseContract._bigNumberToString.bind(self));
            const abiEncodedTransactionData = self._ethersInterface.functions.marketSellOrders(
                orders,
                takerTokenFillAmount,
                signatures,
            ).data
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            takerTokenFillAmount: BigNumber,
            signatures: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{}
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'marketSellOrders'}) as MethodAbi).inputs;
            [orders,
        takerTokenFillAmount,
        signatures,
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        takerTokenFillAmount,
        signatures,
        ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.marketSellOrders(
                orders,
                takerTokenFillAmount,
                signatures,
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'marketSellOrders'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public getOrderHash = {
        async callAsync(
            order: {makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber},
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'getOrderHash'}) as MethodAbi).inputs;
            [order,
        ] = BaseContract._formatABIDataItemList(inputAbi, [order,
        ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.getOrderHash(
                order,
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'getOrderHash'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public fillOrdersFee = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            feeSignatures: string[],
            feeProportion: number|BigNumber,
            feeRecipient: string,
            txData: Partial<TxDataPayable> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrdersFee'}) as MethodAbi).inputs;
            [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feeProportion,
    feeRecipient,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feeProportion,
    feeRecipient,
    ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.fillOrdersFee(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
                feeProportion,
                feeRecipient,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.fillOrdersFee.estimateGasAsync.bind(
                    self,
                    orders,
                    signatures,
                    feeOrders,
                    feeSignatures,
                    feeProportion,
                    feeRecipient,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            feeSignatures: string[],
            feeProportion: number|BigNumber,
            feeRecipient: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrdersFee'}) as MethodAbi).inputs;
            [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feeProportion,
    feeRecipient,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feeProportion,
    feeRecipient,
    ], BaseContract._bigNumberToString.bind(this));
            const encodedData = self._ethersInterface.functions.fillOrdersFee(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
                feeProportion,
                feeRecipient,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                }
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            feeSignatures: string[],
            feeProportion: number|BigNumber,
            feeRecipient: string,
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrdersFee'}) as MethodAbi).inputs;
            [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feeProportion,
    feeRecipient,
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feeProportion,
    feeRecipient,
    ], BaseContract._bigNumberToString.bind(self));
            const abiEncodedTransactionData = self._ethersInterface.functions.fillOrdersFee(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
                feeProportion,
                feeRecipient,
            ).data
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber}>,
            feeSignatures: string[],
            feeProportion: number|BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{}
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrdersFee'}) as MethodAbi).inputs;
            [orders,
        signatures,
        feeOrders,
        feeSignatures,
        feeProportion,
        feeRecipient,
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        signatures,
        feeOrders,
        feeSignatures,
        feeProportion,
        feeRecipient,
        ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.fillOrdersFee(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
                feeProportion,
                feeRecipient,
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'fillOrdersFee'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public fillOrderQuote = {
        async sendTransactionAsync(
            order: {makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber},
            takerTokenFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrderQuote'}) as MethodAbi).inputs;
            [order,
    takerTokenFillAmount,
    signature,
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerTokenFillAmount,
    signature,
    ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.fillOrderQuote(
                order,
                takerTokenFillAmount,
                signature,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.fillOrderQuote.estimateGasAsync.bind(
                    self,
                    order,
                    takerTokenFillAmount,
                    signature,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber},
            takerTokenFillAmount: BigNumber,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrderQuote'}) as MethodAbi).inputs;
            [order,
    takerTokenFillAmount,
    signature,
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerTokenFillAmount,
    signature,
    ], BaseContract._bigNumberToString.bind(this));
            const encodedData = self._ethersInterface.functions.fillOrderQuote(
                order,
                takerTokenFillAmount,
                signature,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                }
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            order: {makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber},
            takerTokenFillAmount: BigNumber,
            signature: string,
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrderQuote'}) as MethodAbi).inputs;
            [order,
    takerTokenFillAmount,
    signature,
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerTokenFillAmount,
    signature,
    ], BaseContract._bigNumberToString.bind(self));
            const abiEncodedTransactionData = self._ethersInterface.functions.fillOrderQuote(
                order,
                takerTokenFillAmount,
                signature,
            ).data
            return abiEncodedTransactionData;
        },
        async callAsync(
            order: {makerAddress: string,takerAddress: string,makerTokenAddress: string,takerTokenAddress: string,feeRecipientAddress: string,makerTokenAmount: BigNumber,takerTokenAmount: BigNumber,makerFeeAmount: BigNumber,takerFeeAmount: BigNumber,expirationTimeSeconds: BigNumber,salt: BigNumber},
            takerTokenFillAmount: BigNumber,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{}
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'fillOrderQuote'}) as MethodAbi).inputs;
            [order,
        takerTokenFillAmount,
        signature,
        ] = BaseContract._formatABIDataItemList(inputAbi, [order,
        takerTokenFillAmount,
        signature,
        ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.fillOrderQuote(
                order,
                takerTokenFillAmount,
                signature,
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'fillOrderQuote'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public MAX_FEE = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'MAX_FEE'}) as MethodAbi).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.MAX_FEE(
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'MAX_FEE'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public EXTERNAL_QUERY_GAS_LIMIT = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'EXTERNAL_QUERY_GAS_LIMIT'}) as MethodAbi).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.EXTERNAL_QUERY_GAS_LIMIT(
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'EXTERNAL_QUERY_GAS_LIMIT'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public onERC721Received = {
        async sendTransactionAsync(
            index_0: string,
            index_1: BigNumber,
            index_2: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'onERC721Received'}) as MethodAbi).inputs;
            [index_0,
    index_1,
    index_2,
    ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
    index_1,
    index_2,
    ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.onERC721Received(
                index_0,
                index_1,
                index_2,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                },
                self.onERC721Received.estimateGasAsync.bind(
                    self,
                    index_0,
                    index_1,
                    index_2,
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            index_0: string,
            index_1: BigNumber,
            index_2: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'onERC721Received'}) as MethodAbi).inputs;
            [index_0,
    index_1,
    index_2,
    ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
    index_1,
    index_2,
    ], BaseContract._bigNumberToString.bind(this));
            const encodedData = self._ethersInterface.functions.onERC721Received(
                index_0,
                index_1,
                index_2,
            ).data
            const txDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    ...txData,
                    data: encodedData,
                }
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            index_0: string,
            index_1: BigNumber,
            index_2: string,
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'onERC721Received'}) as MethodAbi).inputs;
            [index_0,
    index_1,
    index_2,
    ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
    index_1,
    index_2,
    ], BaseContract._bigNumberToString.bind(self));
            const abiEncodedTransactionData = self._ethersInterface.functions.onERC721Received(
                index_0,
                index_1,
                index_2,
            ).data
            return abiEncodedTransactionData;
        },
        async callAsync(
            index_0: string,
            index_1: BigNumber,
            index_2: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ForwarderContract;
            const inputAbi = (_.find(self.abi, {name: 'onERC721Received'}) as MethodAbi).inputs;
            [index_0,
        index_1,
        index_2,
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
        index_1,
        index_2,
        ], BaseContract._bigNumberToString.bind(self));
            const encodedData = self._ethersInterface.functions.onERC721Received(
                index_0,
                index_1,
                index_2,
            ).data;
            const callDataWithDefaults = await self._applyDefaultsToTxDataAsync(
                {
                    data: encodedData,
                }
            )
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            const outputAbi = (_.find(self.abi, {name: 'onERC721Received'}) as MethodAbi).outputs;
            const outputParamsTypes = _.map(outputAbi, 'type');
            let resultArray = ethersContracts.Interface.decodeParams(outputParamsTypes, rawCallResult) as any;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    constructor(web3Wrapper: Web3Wrapper, abi: ContractAbi, address: string) {
        super(web3Wrapper, abi, address);
        classUtils.bindAll(this, ['_ethersInterface', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
