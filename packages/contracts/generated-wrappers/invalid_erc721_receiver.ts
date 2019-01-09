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

export type InvalidERC721ReceiverEventArgs =
    | InvalidERC721ReceiverTokenReceivedEventArgs;

export enum InvalidERC721ReceiverEvents {
    TokenReceived = 'TokenReceived',
}

export interface InvalidERC721ReceiverTokenReceivedEventArgs extends DecodedLogArgs {
    operator: string;
    from: string;
    tokenId: BigNumber;
    data: string;
}


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class InvalidERC721ReceiverContract extends BaseContract {
    public onERC721Received = {
        async sendTransactionAsync(
            _operator: string,
            _from: string,
            _tokenId: BigNumber,
            _data: string,
            txData: Partial<TxData> = {},
        ): Promise<string> {
            const self = this as any as InvalidERC721ReceiverContract;
            const inputAbi = self._lookupAbi('onERC721Received(address,address,uint256,bytes)').inputs;
            [_operator,
    _from,
    _tokenId,
    _data
    ] = BaseContract._formatABIDataItemList(inputAbi, [_operator,
    _from,
    _tokenId,
    _data
    ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_operator,
    _from,
    _tokenId,
    _data
    ]);
            const encodedData = self._lookupEthersInterface('onERC721Received(address,address,uint256,bytes)').functions.onERC721Received.encode([_operator,
    _from,
    _tokenId,
    _data
    ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
                self.onERC721Received.estimateGasAsync.bind(
                    self,
                    _operator,
                    _from,
                    _tokenId,
                    _data
                ),
            );
            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        async estimateGasAsync(
            _operator: string,
            _from: string,
            _tokenId: BigNumber,
            _data: string,
            txData: Partial<TxData> = {},
        ): Promise<number> {
            const self = this as any as InvalidERC721ReceiverContract;
            const inputAbi = self._lookupAbi('onERC721Received(address,address,uint256,bytes)').inputs;
            [_operator,
    _from,
    _tokenId,
    _data
    ] = BaseContract._formatABIDataItemList(inputAbi, [_operator,
    _from,
    _tokenId,
    _data
    ], BaseContract._bigNumberToString);
            const encodedData = self._lookupEthersInterface('onERC721Received(address,address,uint256,bytes)').functions.onERC721Received.encode([_operator,
    _from,
    _tokenId,
    _data
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
            _operator: string,
            _from: string,
            _tokenId: BigNumber,
            _data: string,
        ): string {
            const self = this as any as InvalidERC721ReceiverContract;
            const inputAbi = self._lookupAbi('onERC721Received(address,address,uint256,bytes)').inputs;
            [_operator,
    _from,
    _tokenId,
    _data
    ] = BaseContract._formatABIDataItemList(inputAbi, [_operator,
    _from,
    _tokenId,
    _data
    ], BaseContract._bigNumberToString);
            const abiEncodedTransactionData = self._lookupEthersInterface('onERC721Received(address,address,uint256,bytes)').functions.onERC721Received.encode([_operator,
    _from,
    _tokenId,
    _data
    ]);
            return abiEncodedTransactionData;
        },
        async callAsync(
            _operator: string,
            _from: string,
            _tokenId: BigNumber,
            _data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as InvalidERC721ReceiverContract;
            const functionSignature = 'onERC721Received(address,address,uint256,bytes)';
            const inputAbi = self._lookupAbi(functionSignature).inputs;
            [_operator,
        _from,
        _tokenId,
        _data
        ] = BaseContract._formatABIDataItemList(inputAbi, [_operator,
        _from,
        _tokenId,
        _data
        ], BaseContract._bigNumberToString.bind(self));
            BaseContract.strictArgumentEncodingCheck(inputAbi, [_operator,
        _from,
        _tokenId,
        _data
        ]);
            const ethersFunction = self._lookupEthersInterface(functionSignature).functions.onERC721Received;
            const encodedData = ethersFunction.encode([_operator,
        _from,
        _tokenId,
        _data
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
            const outputAbi = (_.find(self.abi, {name: 'onERC721Received'}) as MethodAbi).outputs;
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._lowercaseAddress.bind(this));
            resultArray = BaseContract._formatABIDataItemList(outputAbi, resultArray, BaseContract._bnToBigNumber.bind(this));
            return resultArray[0];
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact,
        provider: Provider,
        txDefaults: Partial<TxData>,
    ): Promise<InvalidERC721ReceiverContract> {
        if (_.isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return InvalidERC721ReceiverContract.deployAsync(bytecode, abi, provider, txDefaults, );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        provider: Provider,
        txDefaults: Partial<TxData>,
    ): Promise<InvalidERC721ReceiverContract> {
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
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
        logUtils.log(`InvalidERC721Receiver successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new InvalidERC721ReceiverContract(abi, txReceipt.contractAddress as string, provider, txDefaults);
        contractInstance.constructorArgs = [];
        return contractInstance;
    }
    constructor(abi: ContractAbi, address: string, provider: Provider, txDefaults?: Partial<TxData>) {
        super('InvalidERC721Receiver', abi, address, provider, txDefaults);
        classUtils.bindAll(this, ['_ethersInterfacesByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
