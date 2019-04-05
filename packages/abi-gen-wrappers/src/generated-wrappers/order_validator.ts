// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma whitespace class-name
// tslint:disable:no-unused-variable
// tslint:disable:no-unbound-method
import { BaseContract } from '@0x/base-contract';
import { BlockParam, BlockParamLiteral, CallData, ContractAbi, ContractArtifact, DecodedLogArgs, MethodAbi, TxData, TxDataPayable, SupportedProvider } from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { isUndefined } from 'lodash';
// tslint:enable:no-unused-variable


/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class OrderValidatorContract extends BaseContract {
    public getOrderAndTraderInfo = {
        functionSignature: 'getOrderAndTraderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),address)',
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAddress: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}, {makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}]
        > {
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments(self.getOrderAndTraderInfo.functionSignature, [order,
        takerAddress
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getOrderAndTraderInfo.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}, {makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getBalanceAndAllowance = {
        functionSignature: 'getBalanceAndAllowance(address,bytes)',
        async callAsync(
            target: string,
            assetData: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber, BigNumber]
        > {
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments(self.getBalanceAndAllowance.functionSignature, [target,
        assetData
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getBalanceAndAllowance.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getOrdersAndTradersInfo = {
        functionSignature: 'getOrdersAndTradersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAddresses: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[Array<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}>, Array<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}>]
        > {
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments(self.getOrdersAndTradersInfo.functionSignature, [orders,
        takerAddresses
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getOrdersAndTradersInfo.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[Array<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}>, Array<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}>]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getTradersInfo = {
        functionSignature: 'getTradersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address[])',
        async callAsync(
            orders: Array<{makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string}>,
            takerAddresses: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<Array<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}>
        > {
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments(self.getTradersInfo.functionSignature, [orders,
        takerAddresses
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getTradersInfo.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<Array<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}>
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getERC721TokenOwner = {
        functionSignature: 'getERC721TokenOwner(address,uint256)',
        async callAsync(
            token: string,
            tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string
        > {
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments(self.getERC721TokenOwner.functionSignature, [token,
        tokenId
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getERC721TokenOwner.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getBalancesAndAllowances = {
        functionSignature: 'getBalancesAndAllowances(address,bytes[])',
        async callAsync(
            target: string,
            assetData: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber[], BigNumber[]]
        > {
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments(self.getBalancesAndAllowances.functionSignature, [target,
        assetData
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getBalancesAndAllowances.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber[], BigNumber[]]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public getTraderInfo = {
        functionSignature: 'getTraderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),address)',
        async callAsync(
            order: {makerAddress: string;takerAddress: string;feeRecipientAddress: string;senderAddress: string;makerAssetAmount: BigNumber;takerAssetAmount: BigNumber;makerFee: BigNumber;takerFee: BigNumber;expirationTimeSeconds: BigNumber;salt: BigNumber;makerAssetData: string;takerAssetData: string},
            takerAddress: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}
        > {
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments(self.getTraderInfo.functionSignature, [order,
        takerAddress
        ]);
            const rawCallResult = await self._callAsync(self.address, encodedData, callData, defaultBlock);
            const abiEncoder = self._lookupAbiEncoder(self.getTraderInfo.functionSignature);
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
            _exchange: string,
            _zrxAssetData: string,
    ): Promise<OrderValidatorContract> {
        if (isUndefined(artifact.compilerOutput)) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        return OrderValidatorContract.deployAsync(bytecode, abi, provider, txDefaults, _exchange,
_zrxAssetData
);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
            _exchange: string,
            _zrxAssetData: string,
    ): Promise<OrderValidatorContract> {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
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
        return {} as any;
    }
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('OrderValidator', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method
