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

export type TestSignatureValidatorEventArgs =
    | TestSignatureValidatorSignatureValidatorApprovalEventArgs;

export enum TestSignatureValidatorEvents {
    SignatureValidatorApproval = 'SignatureValidatorApproval',
}

export interface TestSignatureValidatorSignatureValidatorApprovalEventArgs extends DecodedLogArgs {
    signerAddress: string;
    validatorAddress: string;
    approved: boolean;
}


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class TestSignatureValidatorContract extends BaseContract {
    public preSign = {
        async sendTransactionAsync(
            hash: string,
            signerAddress: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as TestSignatureValidatorContract;
            const inputAbi = self._lookupAbi('preSign(bytes32,address,bytes)').inputs;
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
            const encodedData = self._lookupEthersInterface('preSign(bytes32,address,bytes)').functions.preSign.encode([hash,
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
                self.preSign.estimateGasAsync.bind(
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
            const self = this as any as TestSignatureValidatorContract;
            const inputAbi = self._lookupAbi('preSign(bytes32,address,bytes)').inputs;
            [hash,
    signerAddress,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
    signerAddress,
    signature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('preSign(bytes32,address,bytes)').functions.preSign.encode([hash,
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
            const self = this as any as TestSignatureValidatorContract;
            const inputAbi = self._lookupAbi('preSign(bytes32,address,bytes)').inputs;
            [hash,
    signerAddress,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
    signerAddress,
    signature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('preSign(bytes32,address,bytes)').functions.preSign.encode([hash,
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
        ): Promise<void
        > {
            const self = this as any as TestSignatureValidatorContract;
            const functionSignature = 'preSign(bytes32,address,bytes)';
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
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.preSign;
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
            const outputAbi = (_.find(self.abi, {name: 'preSign'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public transactions = {
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as TestSignatureValidatorContract;
            const functionSignature = 'transactions(bytes32)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.transactions;
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
            const outputAbi = (_.find(self.abi, {name: 'transactions'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public setSignatureValidatorApproval = {
        async sendTransactionAsync(
            validatorAddress: string,
            approval: boolean,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as TestSignatureValidatorContract;
            const inputAbi = self._lookupAbi('setSignatureValidatorApproval(address,bool)').inputs;
            [validatorAddress,
    approval
    ] = BaseContract._formatABIDataItemList(inputAbi, [validatorAddress,
    approval
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [validatorAddress,
    approval
    ]);
            const encodedData = self._lookupEthersInterface('setSignatureValidatorApproval(address,bool)').functions.setSignatureValidatorApproval.encode([validatorAddress,
    approval
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.setSignatureValidatorApproval.estimateGasAsync.bind(
                    self,
                    validatorAddress,
                    approval
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            validatorAddress: string,
            approval: boolean,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as TestSignatureValidatorContract;
            const inputAbi = self._lookupAbi('setSignatureValidatorApproval(address,bool)').inputs;
            [validatorAddress,
    approval
    ] = BaseContract._formatABIDataItemList(inputAbi, [validatorAddress,
    approval
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('setSignatureValidatorApproval(address,bool)').functions.setSignatureValidatorApproval.encode([validatorAddress,
    approval
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
            validatorAddress: string,
            approval: boolean,
        ): string {
            const self = this as any as TestSignatureValidatorContract;
            const inputAbi = self._lookupAbi('setSignatureValidatorApproval(address,bool)').inputs;
            [validatorAddress,
    approval
    ] = BaseContract._formatABIDataItemList(inputAbi, [validatorAddress,
    approval
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('setSignatureValidatorApproval(address,bool)').functions.setSignatureValidatorApproval.encode([validatorAddress,
    approval
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            validatorAddress: string,
            approval: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as TestSignatureValidatorContract;
            const functionSignature = 'setSignatureValidatorApproval(address,bool)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [validatorAddress,
        approval
        ] = BaseContract._formatABIDataItemList(inputAbi, [validatorAddress,
        approval
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [validatorAddress,
        approval
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.setSignatureValidatorApproval;
            const encodedData = ethersFunction.encode([validatorAddress,
        approval
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
            const outputAbi = (_.find(self.abi, {name: 'setSignatureValidatorApproval'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public allowedValidators = {
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as TestSignatureValidatorContract;
            const functionSignature = 'allowedValidators(address,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0,
        index_1
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
        index_1
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0,
        index_1
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.allowedValidators;
            const encodedData = ethersFunction.encode([index_0,
        index_1
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
            const outputAbi = (_.find(self.abi, {name: 'allowedValidators'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public preSigned = {
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as TestSignatureValidatorContract;
            const functionSignature = 'preSigned(bytes32,address)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [index_0,
        index_1
        ] = BaseContract._formatABIDataItemList(inputAbi, [index_0,
        index_1
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [index_0,
        index_1
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.preSigned;
            const encodedData = ethersFunction.encode([index_0,
        index_1
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
            const outputAbi = (_.find(self.abi, {name: 'preSigned'}) as MethodAbi).outputs;
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
            const self = this as any as TestSignatureValidatorContract;
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
    public publicIsValidSignature = {
        async callAsync(
            hash: string,
            signer: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean
        > {
            const self = this as any as TestSignatureValidatorContract;
            const functionSignature = 'publicIsValidSignature(bytes32,address,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [hash,
        signer,
        signature
        ] = BaseContract._formatABIDataItemList(inputAbi, [hash,
        signer,
        signature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [hash,
        signer,
        signature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.publicIsValidSignature;
            const encodedData = ethersFunction.encode([hash,
        signer,
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
            const outputAbi = (_.find(self.abi, {name: 'publicIsValidSignature'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public executeTransaction = {
        async sendTransactionAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as TestSignatureValidatorContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256,address,bytes,bytes)').inputs;
            [salt,
    signerAddress,
    data,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [salt,
    signerAddress,
    data,
    signature
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [salt,
    signerAddress,
    data,
    signature
    ]);
            const encodedData = self._lookupEthersInterface('executeTransaction(uint256,address,bytes,bytes)').functions.executeTransaction.encode([salt,
    signerAddress,
    data,
    signature
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.executeTransaction.estimateGasAsync.bind(
                    self,
                    salt,
                    signerAddress,
                    data,
                    signature
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as TestSignatureValidatorContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256,address,bytes,bytes)').inputs;
            [salt,
    signerAddress,
    data,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [salt,
    signerAddress,
    data,
    signature
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('executeTransaction(uint256,address,bytes,bytes)').functions.executeTransaction.encode([salt,
    signerAddress,
    data,
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
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
        ): string {
            const self = this as any as TestSignatureValidatorContract;
            const inputAbi = self._lookupAbi('executeTransaction(uint256,address,bytes,bytes)').inputs;
            [salt,
    signerAddress,
    data,
    signature
    ] = BaseContract._formatABIDataItemList(inputAbi, [salt,
    signerAddress,
    data,
    signature
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('executeTransaction(uint256,address,bytes,bytes)').functions.executeTransaction.encode([salt,
    signerAddress,
    data,
    signature
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            salt: BigNumber,
            signerAddress: string,
            data: string,
            signature: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void
        > {
            const self = this as any as TestSignatureValidatorContract;
            const functionSignature = 'executeTransaction(uint256,address,bytes,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [salt,
        signerAddress,
        data,
        signature
        ] = BaseContract._formatABIDataItemList(inputAbi, [salt,
        signerAddress,
        data,
        signature
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [salt,
        signerAddress,
        data,
        signature
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.executeTransaction;
            const encodedData = ethersFunction.encode([salt,
        signerAddress,
        data,
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
            const outputAbi = (_.find(self.abi, {name: 'executeTransaction'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray;
        },
    };
    public EIP712_DOMAIN_HASH = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as TestSignatureValidatorContract;
            const functionSignature = 'EIP712_DOMAIN_HASH()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.EIP712_DOMAIN_HASH;
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
            const outputAbi = (_.find(self.abi, {name: 'EIP712_DOMAIN_HASH'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public currentContextAddress = {
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as TestSignatureValidatorContract;
            const functionSignature = 'currentContextAddress()';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [] = BaseContract._formatABIDataItemList(inputAbi, [], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, []);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.currentContextAddress;
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
            const outputAbi = (_.find(self.abi, {name: 'currentContextAddress'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
    ): Promise<TestSignatureValidatorContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return TestSignatureValidatorContract.deployAsync(bytecode, abi, provider, txDefaults, );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
    ): Promise<TestSignatureValidatorContract> {
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
        logUtils.log(`TestSignatureValidator successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new TestSignatureValidatorContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('TestSignatureValidator', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
