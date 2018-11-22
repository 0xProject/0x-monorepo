// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, Provider, TxData, TxDataPayable } from 'ethereum-types';
import { BigNumber, classUtils, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';
// tslint:enable:no-unused-variable


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ForwarderContract extends BaseContract {
    public marketBuyOrdersWithEth = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData: Partial<TxDataPayable> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('marketBuyOrdersWithEth(tuple[],uint256,bytes[],tuple[],bytes[],uint256,address)').inputs;
            [orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            const encodedData = self._lookupEthersInterface('marketBuyOrdersWithEth(tuple[],uint256,bytes[],tuple[],bytes[],uint256,address)').functions.marketBuyOrdersWithEth.encode([orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketBuyOrdersWithEth.estimateGasAsync.bind(
                    self,
                    orders,
                    makerAssetFillAmount,
                    signatures,
                    feeOrders,
                    feeSignatures,
                    feePercentage,
                    feeRecipient
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('marketBuyOrdersWithEth(tuple[],uint256,bytes[],tuple[],bytes[],uint256,address)').inputs;
            [orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('marketBuyOrdersWithEth(tuple[],uint256,bytes[],tuple[],bytes[],uint256,address)').functions.marketBuyOrdersWithEth.encode([orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('marketBuyOrdersWithEth(tuple[],uint256,bytes[],tuple[],bytes[],uint256,address)').inputs;
            [orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('marketBuyOrdersWithEth(tuple[],uint256,bytes[],tuple[],bytes[],uint256,address)').functions.marketBuyOrdersWithEth.encode([orders,
    makerAssetFillAmount,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            makerAssetFillAmount: BigNumber,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}, {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}]
        > {
            const self = this as any as ForwarderContract;
            const functionSignature = 'marketBuyOrdersWithEth(tuple[],uint256,bytes[],tuple[],bytes[],uint256,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        makerAssetFillAmount,
        signatures,
        feeOrders,
        feeSignatures,
        feePercentage,
        feeRecipient
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        makerAssetFillAmount,
        signatures,
        feeOrders,
        feeSignatures,
        feePercentage,
        feeRecipient
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        makerAssetFillAmount,
        signatures,
        feeOrders,
        feeSignatures,
        feePercentage,
        feeRecipient
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.marketBuyOrdersWithEth;
            const encodedData = ethersFunction.encode([orders,
        makerAssetFillAmount,
        signatures,
        feeOrders,
        feeSignatures,
        feePercentage,
        feeRecipient
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'marketBuyOrdersWithEth'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public withdrawAsset = {
        async sendTransactionAsync(
            assetData: string,
            amount: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('withdrawAsset(bytes,uint256)').inputs;
            [assetData,
    amount
    ] = BaseContract._formatABIDataItemList(inputAbi, [assetData,
    amount
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [assetData,
    amount
    ]);
            const encodedData = self._lookupEthersInterface('withdrawAsset(bytes,uint256)').functions.withdrawAsset.encode([assetData,
    amount
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.withdrawAsset.estimateGasAsync.bind(
                    self,
                    assetData,
                    amount
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            assetData: string,
            amount: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('withdrawAsset(bytes,uint256)').inputs;
            [assetData,
    amount
    ] = BaseContract._formatABIDataItemList(inputAbi, [assetData,
    amount
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('withdrawAsset(bytes,uint256)').functions.withdrawAsset.encode([assetData,
    amount
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            assetData: string,
            amount: BigNumber,
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('withdrawAsset(bytes,uint256)').inputs;
            [assetData,
    amount
    ] = BaseContract._formatABIDataItemList(inputAbi, [assetData,
    amount
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('withdrawAsset(bytes,uint256)').functions.withdrawAsset.encode([assetData,
    amount
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            assetData: string,
            amount: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ForwarderContract;
            const functionSignature = 'withdrawAsset(bytes,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [assetData,
        amount
        ] = BaseContract._formatABIDataItemList(inputAbi, [assetData,
        amount
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [assetData,
        amount
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.withdrawAsset;
            const encodedData = ethersFunction.encode([assetData,
        amount
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'withdrawAsset'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public owner = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as ForwarderContract;
            const functionSignature = 'owner()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.owner;
            const encodedData = ethersFunction.encode([]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'owner'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public marketSellOrdersWithEth = {
        async sendTransactionAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData: Partial<TxDataPayable> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('marketSellOrdersWithEth(tuple[],bytes[],tuple[],bytes[],uint256,address)').inputs;
            [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            const encodedData = self._lookupEthersInterface('marketSellOrdersWithEth(tuple[],bytes[],tuple[],bytes[],uint256,address)').functions.marketSellOrdersWithEth.encode([orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.marketSellOrdersWithEth.estimateGasAsync.bind(
                    self,
                    orders,
                    signatures,
                    feeOrders,
                    feeSignatures,
                    feePercentage,
                    feeRecipient
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('marketSellOrdersWithEth(tuple[],bytes[],tuple[],bytes[],uint256,address)').inputs;
            [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('marketSellOrdersWithEth(tuple[],bytes[],tuple[],bytes[],uint256,address)').functions.marketSellOrdersWithEth.encode([orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('marketSellOrdersWithEth(tuple[],bytes[],tuple[],bytes[],uint256,address)').inputs;
            [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('marketSellOrdersWithEth(tuple[],bytes[],tuple[],bytes[],uint256,address)').functions.marketSellOrdersWithEth.encode([orders,
    signatures,
    feeOrders,
    feeSignatures,
    feePercentage,
    feeRecipient
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            signatures: string[],
            feeOrders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            feeSignatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[{makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}, {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber}]
        > {
            const self = this as any as ForwarderContract;
            const functionSignature = 'marketSellOrdersWithEth(tuple[],bytes[],tuple[],bytes[],uint256,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        signatures,
        feeOrders,
        feeSignatures,
        feePercentage,
        feeRecipient
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        signatures,
        feeOrders,
        feeSignatures,
        feePercentage,
        feeRecipient
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        signatures,
        feeOrders,
        feeSignatures,
        feePercentage,
        feeRecipient
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.marketSellOrdersWithEth;
            const encodedData = ethersFunction.encode([orders,
        signatures,
        feeOrders,
        feeSignatures,
        feePercentage,
        feeRecipient
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'marketSellOrdersWithEth'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public transferOwnership = {
        async sendTransactionAsync(
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner
    ] = BaseContract._formatABIDataItemList(inputAbi, [newOwner
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [newOwner
    ]);
            const encodedData = self._lookupEthersInterface('transferOwnership(address)').functions.transferOwnership.encode([newOwner
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.transferOwnership.estimateGasAsync.bind(
                    self,
                    newOwner
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            newOwner: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner
    ] = BaseContract._formatABIDataItemList(inputAbi, [newOwner
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('transferOwnership(address)').functions.transferOwnership.encode([newOwner
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        getABIEncodedTransactionData(
            newOwner: string,
        ): string {
            const self = this as any as ForwarderContract;
            const inputAbi = self._lookupAbi('transferOwnership(address)').inputs;
            [newOwner
    ] = BaseContract._formatABIDataItemList(inputAbi, [newOwner
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('transferOwnership(address)').functions.transferOwnership.encode([newOwner
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            newOwner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ForwarderContract;
            const functionSignature = 'transferOwnership(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [newOwner
        ] = BaseContract._formatABIDataItemList(inputAbi, [newOwner
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [newOwner
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.transferOwnership;
            const encodedData = ethersFunction.encode([newOwner
        ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'transferOwnership'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _exchange: string,
            _zrxAssetData: string,
            _wethAssetData: string,
    ): Promise<ForwarderContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return ForwarderContract.deployAsync(bytecode, abi, provider, txDefaults, _exchange,
_zrxAssetData,
_wethAssetData
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _exchange: string,
            _zrxAssetData: string,
            _wethAssetData: string,
    ): Promise<ForwarderContract> {
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchange,
_zrxAssetData,
_wethAssetData
] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange,
_zrxAssetData,
_wethAssetData
],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange,
_zrxAssetData,
_wethAssetData
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
        logUtils.log(`Forwarder successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ForwarderContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_exchange,
_zrxAssetData,
_wethAssetData
];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('Forwarder', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
