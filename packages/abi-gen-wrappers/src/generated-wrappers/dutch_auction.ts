// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, Provider, TxData, TxDataPayable } from 'ethereum-types';
import { BigNumber, classUtils, logUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethers from 'ethers';
import * as _ from 'lodash';
// tslint:enable:no-unused-variable


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class DutchAuctionContract extends BaseContract {
    public getAuctionDetails = {
        async sendTransactionAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as DutchAuctionContract;
            const inputAbi = self._lookupAbi('getAuctionDetails({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').inputs;
            [order
    ] = BaseContract._formatABIDataItemList(inputAbi, [order
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order
    ]);
            const encodedData = self._lookupEthersInterface('getAuctionDetails({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').functions.getAuctionDetails.encode([order
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.getAuctionDetails.estimateGasAsync.bind(
                    self,
                    order
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DutchAuctionContract;
            const inputAbi = self._lookupAbi('getAuctionDetails({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').inputs;
            [order
    ] = BaseContract._formatABIDataItemList(inputAbi, [order
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('getAuctionDetails({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').functions.getAuctionDetails.encode([order
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
        ): string {
            const self = this as any as DutchAuctionContract;
            const inputAbi = self._lookupAbi('getAuctionDetails({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').inputs;
            [order
    ] = BaseContract._formatABIDataItemList(inputAbi, [order
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('getAuctionDetails({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})').functions.getAuctionDetails.encode([order
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{beginTimeSeconds: BigNumber;endTimeSeconds: BigNumber;beginAmount: BigNumber;endAmount: BigNumber;currentAmount: BigNumber;currentTimeSeconds: BigNumber}
        > {
            const self = this as any as DutchAuctionContract;
            const functionSignature = 'getAuctionDetails({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes})';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [order
        ] = BaseContract._formatABIDataItemList(inputAbi, [order
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getAuctionDetails;
            const encodedData = ethersFunction.encode([order
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
            const outputAbi = (_.find(self.abi, {name: 'getAuctionDetails'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public matchOrders = {
        async sendTransactionAsync(
            buyOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            sellOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            buySignature: string,
            sellSignature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as DutchAuctionContract;
            const inputAbi = self._lookupAbi('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').inputs;
            [buyOrder,
    sellOrder,
    buySignature,
    sellSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [buyOrder,
    sellOrder,
    buySignature,
    sellSignature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [buyOrder,
    sellOrder,
    buySignature,
    sellSignature
    ]);
            const encodedData = self._lookupEthersInterface('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').functions.matchOrders.encode([buyOrder,
    sellOrder,
    buySignature,
    sellSignature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.matchOrders.estimateGasAsync.bind(
                    self,
                    buyOrder,
                    sellOrder,
                    buySignature,
                    sellSignature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            buyOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            sellOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            buySignature: string,
            sellSignature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as DutchAuctionContract;
            const inputAbi = self._lookupAbi('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').inputs;
            [buyOrder,
    sellOrder,
    buySignature,
    sellSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [buyOrder,
    sellOrder,
    buySignature,
    sellSignature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').functions.matchOrders.encode([buyOrder,
    sellOrder,
    buySignature,
    sellSignature
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
            buyOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            sellOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            buySignature: string,
            sellSignature: string,
        ): string {
            const self = this as any as DutchAuctionContract;
            const inputAbi = self._lookupAbi('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').inputs;
            [buyOrder,
    sellOrder,
    buySignature,
    sellSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [buyOrder,
    sellOrder,
    buySignature,
    sellSignature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)').functions.matchOrders.encode([buyOrder,
    sellOrder,
    buySignature,
    sellSignature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            buyOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            sellOrder: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            buySignature: string,
            sellSignature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{left: {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber};right: {makerAssetFilledAmount: BigNumber;takerAssetFilledAmount: BigNumber;makerFeePaid: BigNumber;takerFeePaid: BigNumber};leftMakerAssetSpreadAmount: BigNumber}
        > {
            const self = this as any as DutchAuctionContract;
            const functionSignature = 'matchOrders({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},{address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},bytes,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [buyOrder,
        sellOrder,
        buySignature,
        sellSignature
        ] = BaseContract._formatABIDataItemList(inputAbi, [buyOrder,
        sellOrder,
        buySignature,
        sellSignature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [buyOrder,
        sellOrder,
        buySignature,
        sellSignature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.matchOrders;
            const encodedData = ethersFunction.encode([buyOrder,
        sellOrder,
        buySignature,
        sellSignature
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
            const outputAbi = (_.find(self.abi, {name: 'matchOrders'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _exchange: string,
    ): Promise<DutchAuctionContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return DutchAuctionContract.deployAsync(bytecode, abi, provider, txDefaults, _exchange
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _exchange: string,
    ): Promise<DutchAuctionContract> {
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
        logUtils.log(`DutchAuction successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new DutchAuctionContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_exchange
];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('DutchAuction', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
