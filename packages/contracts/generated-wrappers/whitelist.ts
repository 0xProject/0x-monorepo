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
export class WhitelistContract extends BaseContract {
    public fillOrderIfWhitelisted = {
        async sendTransactionAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            salt: BigNumber,
            orderSignature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as WhitelistContract;
            const inputAbi = self._lookupAbi('fillOrderIfWhitelisted({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    salt,
    orderSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    salt,
    orderSignature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
    takerAssetFillAmount,
    salt,
    orderSignature
    ]);
            const encodedData = self._lookupEthersInterface('fillOrderIfWhitelisted({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes)').functions.fillOrderIfWhitelisted.encode([order,
    takerAssetFillAmount,
    salt,
    orderSignature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.fillOrderIfWhitelisted.estimateGasAsync.bind(
                    self,
                    order,
                    takerAssetFillAmount,
                    salt,
                    orderSignature
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
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WhitelistContract;
            const inputAbi = self._lookupAbi('fillOrderIfWhitelisted({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    salt,
    orderSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    salt,
    orderSignature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('fillOrderIfWhitelisted({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes)').functions.fillOrderIfWhitelisted.encode([order,
    takerAssetFillAmount,
    salt,
    orderSignature
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
        ): string {
            const self = this as any as WhitelistContract;
            const inputAbi = self._lookupAbi('fillOrderIfWhitelisted({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes)').inputs;
            [order,
    takerAssetFillAmount,
    salt,
    orderSignature
    ] = BaseContract._formatABIDataItemList(inputAbi, [order,
    takerAssetFillAmount,
    salt,
    orderSignature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('fillOrderIfWhitelisted({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes)').functions.fillOrderIfWhitelisted.encode([order,
    takerAssetFillAmount,
    salt,
    orderSignature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAssetFillAmount: BigNumber,
            salt: BigNumber,
            orderSignature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as WhitelistContract;
            const functionSignature = 'fillOrderIfWhitelisted({address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes},uint256,uint256,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [order,
        takerAssetFillAmount,
        salt,
        orderSignature
        ] = BaseContract._formatABIDataItemList(inputAbi, [order,
        takerAssetFillAmount,
        salt,
        orderSignature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [order,
        takerAssetFillAmount,
        salt,
        orderSignature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.fillOrderIfWhitelisted;
            const encodedData = ethersFunction.encode([order,
        takerAssetFillAmount,
        salt,
        orderSignature
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
            const outputAbi = (_.find(self.abi, {name: 'fillOrderIfWhitelisted'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public isWhitelisted = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as WhitelistContract;
            const functionSignature = 'isWhitelisted(address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.isWhitelisted;
            const encodedData = ethersFunction.encode([index_0
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
            const outputAbi = (_.find(self.abi, {name: 'isWhitelisted'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public owner = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as WhitelistContract;
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
    public isValidSignature = {
        async callAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as WhitelistContract;
            const functionSignature = 'isValidSignature(bytes32,address,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [hash,
        signerAddress,
        signature
        ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
        signerAddress,
        signature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [hash,
        signerAddress,
        signature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.isValidSignature;
            const encodedData = ethersFunction.encode([hash,
        signerAddress,
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
            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
            let resultArray = ethersFunction.decode(rawCallResult);
            const outputAbi = (_.find(self.abi, {name: 'isValidSignature'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public updateWhitelistStatus = {
        async sendTransactionAsync(
            target: string,
            isApproved: boolean,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as WhitelistContract;
            const inputAbi = self._lookupAbi('updateWhitelistStatus(address,bool)').inputs;
            [target,
    isApproved
    ] = BaseContract._formatABIDataItemList(inputAbi, [target,
    isApproved
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [target,
    isApproved
    ]);
            const encodedData = self._lookupEthersInterface('updateWhitelistStatus(address,bool)').functions.updateWhitelistStatus.encode([target,
    isApproved
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.updateWhitelistStatus.estimateGasAsync.bind(
                    self,
                    target,
                    isApproved
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            target: string,
            isApproved: boolean,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as WhitelistContract;
            const inputAbi = self._lookupAbi('updateWhitelistStatus(address,bool)').inputs;
            [target,
    isApproved
    ] = BaseContract._formatABIDataItemList(inputAbi, [target,
    isApproved
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('updateWhitelistStatus(address,bool)').functions.updateWhitelistStatus.encode([target,
    isApproved
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
            target: string,
            isApproved: boolean,
        ): string {
            const self = this as any as WhitelistContract;
            const inputAbi = self._lookupAbi('updateWhitelistStatus(address,bool)').inputs;
            [target,
    isApproved
    ] = BaseContract._formatABIDataItemList(inputAbi, [target,
    isApproved
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('updateWhitelistStatus(address,bool)').functions.updateWhitelistStatus.encode([target,
    isApproved
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            target: string,
            isApproved: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as WhitelistContract;
            const functionSignature = 'updateWhitelistStatus(address,bool)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [target,
        isApproved
        ] = BaseContract._formatABIDataItemList(inputAbi, [target,
        isApproved
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [target,
        isApproved
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.updateWhitelistStatus;
            const encodedData = ethersFunction.encode([target,
        isApproved
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
            const outputAbi = (_.find(self.abi, {name: 'updateWhitelistStatus'}) as MethodAbi).outputs;
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
            const self = this as any as WhitelistContract;
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
            const self = this as any as WhitelistContract;
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
            const self = this as any as WhitelistContract;
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
            const self = this as any as WhitelistContract;
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
    ): Promise<WhitelistContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return WhitelistContract.deployAsync(bytecode, abi, provider, txDefaults, _exchange
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
            _exchange: string,
    ): Promise<WhitelistContract> {
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
        logUtils.log(`Whitelist successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new WhitelistContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [_exchange
];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('Whitelist', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
