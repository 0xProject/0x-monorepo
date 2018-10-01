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
export class TestStaticCallReceiverContract extends BaseContract {
    public isValidSignature2 = {
        async sendTransactionAsync(
            hash: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as TestStaticCallReceiverContract;
            const inputAbi = self._lookupAbi('isValidSignature(bytes32,bytes)').inputs;
            [hash,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
    signature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [hash,
    signature
    ]);
            const encodedData = self._lookupEthersInterface('isValidSignature(bytes32,bytes)').functions.isValidSignature.encode([hash,
    signature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.isValidSignature2.estimateGasAsync.bind(
                    self,
                    hash,
                    signature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            hash: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as TestStaticCallReceiverContract;
            const inputAbi = self._lookupAbi('isValidSignature(bytes32,bytes)').inputs;
            [hash,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
    signature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('isValidSignature(bytes32,bytes)').functions.isValidSignature.encode([hash,
    signature
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
            hash: string,
            signature: string,
        ): string {
            const self = this as any as TestStaticCallReceiverContract;
            const inputAbi = self._lookupAbi('isValidSignature(bytes32,bytes)').inputs;
            [hash,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
    signature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('isValidSignature(bytes32,bytes)').functions.isValidSignature.encode([hash,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            hash: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as TestStaticCallReceiverContract;
            const functionSignature = 'isValidSignature(bytes32,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [hash,
        signature
        ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
        signature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [hash,
        signature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.isValidSignature;
            const encodedData = ethersFunction.encode([hash,
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
    public isValidSignature1 = {
        async sendTransactionAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as TestStaticCallReceiverContract;
            const inputAbi = self._lookupAbi('isValidSignature(bytes32,address,bytes)').inputs;
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
            const encodedData = self._lookupEthersInterface('isValidSignature(bytes32,address,bytes)').functions.isValidSignature.encode([hash,
    signerAddress,
    signature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.isValidSignature1.estimateGasAsync.bind(
                    self,
                    hash,
                    signerAddress,
                    signature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as TestStaticCallReceiverContract;
            const inputAbi = self._lookupAbi('isValidSignature(bytes32,address,bytes)').inputs;
            [hash,
    signerAddress,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
    signerAddress,
    signature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('isValidSignature(bytes32,address,bytes)').functions.isValidSignature.encode([hash,
    signerAddress,
    signature
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
            hash: string,
            signerAddress: string,
            signature: string,
        ): string {
            const self = this as any as TestStaticCallReceiverContract;
            const inputAbi = self._lookupAbi('isValidSignature(bytes32,address,bytes)').inputs;
            [hash,
    signerAddress,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
    signerAddress,
    signature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('isValidSignature(bytes32,address,bytes)').functions.isValidSignature.encode([hash,
    signerAddress,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as TestStaticCallReceiverContract;
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
    public approveERC20 = {
        async sendTransactionAsync(
            token: string,
            spender: string,
            value: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as TestStaticCallReceiverContract;
            const inputAbi = self._lookupAbi('approveERC20(address,address,uint256)').inputs;
            [token,
    spender,
    value
    ] = BaseContract._formatABIDataItemList(inputAbi, [token,
    spender,
    value
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [token,
    spender,
    value
    ]);
            const encodedData = self._lookupEthersInterface('approveERC20(address,address,uint256)').functions.approveERC20.encode([token,
    spender,
    value
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.approveERC20.estimateGasAsync.bind(
                    self,
                    token,
                    spender,
                    value
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            token: string,
            spender: string,
            value: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as TestStaticCallReceiverContract;
            const inputAbi = self._lookupAbi('approveERC20(address,address,uint256)').inputs;
            [token,
    spender,
    value
    ] = BaseContract._formatABIDataItemList(inputAbi, [token,
    spender,
    value
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('approveERC20(address,address,uint256)').functions.approveERC20.encode([token,
    spender,
    value
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
            token: string,
            spender: string,
            value: BigNumber,
        ): string {
            const self = this as any as TestStaticCallReceiverContract;
            const inputAbi = self._lookupAbi('approveERC20(address,address,uint256)').inputs;
            [token,
    spender,
    value
    ] = BaseContract._formatABIDataItemList(inputAbi, [token,
    spender,
    value
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('approveERC20(address,address,uint256)').functions.approveERC20.encode([token,
    spender,
    value
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            token: string,
            spender: string,
            value: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as TestStaticCallReceiverContract;
            const functionSignature = 'approveERC20(address,address,uint256)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [token,
        spender,
        value
        ] = BaseContract._formatABIDataItemList(inputAbi, [token,
        spender,
        value
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [token,
        spender,
        value
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.approveERC20;
            const encodedData = ethersFunction.encode([token,
        spender,
        value
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
            const outputAbi = (_.find(self.abi, {name: 'approveERC20'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
    ): Promise<TestStaticCallReceiverContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return TestStaticCallReceiverContract.deployAsync(bytecode, abi, provider, txDefaults, );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
    ): Promise<TestStaticCallReceiverContract> {
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, []);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            {data: txData},
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`TestStaticCallReceiver successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new TestStaticCallReceiverContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('TestStaticCallReceiver', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
