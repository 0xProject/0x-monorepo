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
export class OrderValidatorContract extends BaseContract {
    public getOrderAndTraderInfo = {
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAddress: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}, {makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}]
        > {
            const self = this as any as OrderValidatorContract;
            const functionSignature = 'getOrderAndTraderInfo({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [order,
        takerAddress
        ] = BaseContract._formatABIDataItemList(inputAbi, [order,
        takerAddress
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
        takerAddress
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getOrderAndTraderInfo;
            const encodedData = ethersFunction.encode([order,
        takerAddress
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
            const outputAbi = (_.find(self.abi, {name: 'getOrderAndTraderInfo'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public getBalanceAndAllowance = {
        async callAsync(
            target: string,
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber, BigNumber]
        > {
            const self = this as any as OrderValidatorContract;
            const functionSignature = 'getBalanceAndAllowance(address,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [target,
        assetData
        ] = BaseContract._formatABIDataItemList(inputAbi, [target,
        assetData
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [target,
        assetData
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getBalanceAndAllowance;
            const encodedData = ethersFunction.encode([target,
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
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'getBalanceAndAllowance'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public getOrdersAndTradersInfo = {
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAddresses: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[Array<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}>, Array<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}>]
        > {
            const self = this as any as OrderValidatorContract;
            const functionSignature = 'getOrdersAndTradersInfo(tuple[],address[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        takerAddresses
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        takerAddresses
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        takerAddresses
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getOrdersAndTradersInfo;
            const encodedData = ethersFunction.encode([orders,
        takerAddresses
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
            const outputAbi = (_.find(self.abi, {name: 'getOrdersAndTradersInfo'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public getTradersInfo = {
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAddresses: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<Array<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}>
        > {
            const self = this as any as OrderValidatorContract;
            const functionSignature = 'getTradersInfo(tuple[],address[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [orders,
        takerAddresses
        ] = BaseContract._formatABIDataItemList(inputAbi, [orders,
        takerAddresses
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [orders,
        takerAddresses
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getTradersInfo;
            const encodedData = ethersFunction.encode([orders,
        takerAddresses
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
            const outputAbi = (_.find(self.abi, {name: 'getTradersInfo'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public getERC721TokenOwner = {
        async callAsync(
            token: string,
            tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as OrderValidatorContract;
            const functionSignature = 'getERC721TokenOwner(address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [token,
        tokenId
        ] = BaseContract._formatABIDataItemList(inputAbi, [token,
        tokenId
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [token,
        tokenId
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getERC721TokenOwner;
            const encodedData = ethersFunction.encode([token,
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
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'getERC721TokenOwner'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public getBalancesAndAllowances = {
        async callAsync(
            target: string,
            assetData: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber[], BigNumber[]]
        > {
            const self = this as any as OrderValidatorContract;
            const functionSignature = 'getBalancesAndAllowances(address,bytes[])';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [target,
        assetData
        ] = BaseContract._formatABIDataItemList(inputAbi, [target,
        assetData
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [target,
        assetData
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getBalancesAndAllowances;
            const encodedData = ethersFunction.encode([target,
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
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'getBalancesAndAllowances'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public getTraderInfo = {
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAddress: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}
        > {
            const self = this as any as OrderValidatorContract;
            const functionSignature = 'getTraderInfo({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [order,
        takerAddress
        ] = BaseContract._formatABIDataItemList(inputAbi, [order,
        takerAddress
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
        takerAddress
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.getTraderInfo;
            const encodedData = ethersFunction.encode([order,
        takerAddress
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
            const outputAbi = (_.find(self.abi, {name: 'getTraderInfo'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _exchange: string,
            _zrxAssetData: string,
    ): Promise<OrderValidatorContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return OrderValidatorContract.deployAsync(bytecode, abi, provider, txDefaults, _exchange,
_zrxAssetData
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _exchange: string,
            _zrxAssetData: string,
    ): Promise<OrderValidatorContract> {
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchange,
_zrxAssetData
] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange,
_zrxAssetData
],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange,
_zrxAssetData
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
        logUtils.log(`OrderValidator successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new OrderValidatorContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_exchange,
_zrxAssetData
];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('OrderValidator', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
