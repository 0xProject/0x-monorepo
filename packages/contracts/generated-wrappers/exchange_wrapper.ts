// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0xproject/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, Provider, TxData, TxDataPayable } from 'ethereum-types';
import { BigNumber, classUtils, logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';
// tslint:enable:no-unused-variable


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ExchangeWrapperContract extends BaseContract {
    public fillOrder = {
        async sendTransactionAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            salt: BigNumber,
            orderSignature: string,
            takerSignature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeWrapperContract;
            const inputAbi = self._lookupAbi('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    salt,
    orderSignature,
    takerSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    salt,
    orderSignature,
    takerSignature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
    takerAssetFillAmount,
    salt,
    orderSignature,
    takerSignature
    ]);
            const encodedData = self._lookupEthersInterface('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes,bytes)').functions.fillOrder.encode([order,
    takerAssetFillAmount,
    salt,
    orderSignature,
    takerSignature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.fillOrder.estimateGasAsync.bind(
                    self,
                    order,
                    takerAssetFillAmount,
                    salt,
                    orderSignature,
                    takerSignature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            salt: BigNumber,
            orderSignature: string,
            takerSignature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeWrapperContract;
            const inputAbi = self._lookupAbi('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    salt,
    orderSignature,
    takerSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    salt,
    orderSignature,
    takerSignature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes,bytes)').functions.fillOrder.encode([order,
    takerAssetFillAmount,
    salt,
    orderSignature,
    takerSignature
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
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            salt: BigNumber,
            orderSignature: string,
            takerSignature: string,
        ): string {
            const self = this as any as ExchangeWrapperContract;
            const inputAbi = self._lookupAbi('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    salt,
    orderSignature,
    takerSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    salt,
    orderSignature,
    takerSignature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes,bytes)').functions.fillOrder.encode([order,
    takerAssetFillAmount,
    salt,
    orderSignature,
    takerSignature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            salt: BigNumber,
            orderSignature: string,
            takerSignature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeWrapperContract;
            const functionSignature = 'fillOrder({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [order,
        takerAssetFillAmount,
        salt,
        orderSignature,
        takerSignature
        ] = BaseContract._formatABIDataItemList(inputAbi, [order,
        takerAssetFillAmount,
        salt,
        orderSignature,
        takerSignature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
        takerAssetFillAmount,
        salt,
        orderSignature,
        takerSignature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.fillOrder;
            const encodedData = ethersFunction.encode([order,
        takerAssetFillAmount,
        salt,
        orderSignature,
        takerSignature
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
            const outputAbi = (_.find(self.abi, {name: 'fillOrder'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public cancelOrdersUpTo = {
        async sendTransactionAsync(
            targetOrderEpoch: BigNumber,
            salt: BigNumber,
            makerSignature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as ExchangeWrapperContract;
            const inputAbi = self._lookupAbi('cancelOrdersUpTo(uint256,uint256,bytes)').inputs;
            [targetOrderEpoch,
    salt,
    makerSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [targetOrderEpoch,
    salt,
    makerSignature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [targetOrderEpoch,
    salt,
    makerSignature
    ]);
            const encodedData = self._lookupEthersInterface('cancelOrdersUpTo(uint256,uint256,bytes)').functions.cancelOrdersUpTo.encode([targetOrderEpoch,
    salt,
    makerSignature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.cancelOrdersUpTo.estimateGasAsync.bind(
                    self,
                    targetOrderEpoch,
                    salt,
                    makerSignature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            targetOrderEpoch: BigNumber,
            salt: BigNumber,
            makerSignature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as ExchangeWrapperContract;
            const inputAbi = self._lookupAbi('cancelOrdersUpTo(uint256,uint256,bytes)').inputs;
            [targetOrderEpoch,
    salt,
    makerSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [targetOrderEpoch,
    salt,
    makerSignature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('cancelOrdersUpTo(uint256,uint256,bytes)').functions.cancelOrdersUpTo.encode([targetOrderEpoch,
    salt,
    makerSignature
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
            targetOrderEpoch: BigNumber,
            salt: BigNumber,
            makerSignature: string,
        ): string {
            const self = this as any as ExchangeWrapperContract;
            const inputAbi = self._lookupAbi('cancelOrdersUpTo(uint256,uint256,bytes)').inputs;
            [targetOrderEpoch,
    salt,
    makerSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [targetOrderEpoch,
    salt,
    makerSignature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('cancelOrdersUpTo(uint256,uint256,bytes)').functions.cancelOrdersUpTo.encode([targetOrderEpoch,
    salt,
    makerSignature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            targetOrderEpoch: BigNumber,
            salt: BigNumber,
            makerSignature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as ExchangeWrapperContract;
            const functionSignature = 'cancelOrdersUpTo(uint256,uint256,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [targetOrderEpoch,
        salt,
        makerSignature
        ] = BaseContract._formatABIDataItemList(inputAbi, [targetOrderEpoch,
        salt,
        makerSignature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [targetOrderEpoch,
        salt,
        makerSignature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.cancelOrdersUpTo;
            const encodedData = ethersFunction.encode([targetOrderEpoch,
        salt,
        makerSignature
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
            const outputAbi = (_.find(self.abi, {name: 'cancelOrdersUpTo'}) as MethodAbi).outputs;
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
    ): Promise<ExchangeWrapperContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return ExchangeWrapperContract.deployAsync(bytecode, abi, provider, txDefaults, _exchange
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _exchange: string,
    ): Promise<ExchangeWrapperContract> {
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchange
] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange
],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.Interface(abi);
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
        logUtils.log(`ExchangeWrapper successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ExchangeWrapperContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_exchange
];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('ExchangeWrapper', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
