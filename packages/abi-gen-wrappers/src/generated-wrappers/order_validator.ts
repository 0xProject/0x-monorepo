// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import { BaseContract, PromiseWithTransactionHash } from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
    CallData,
    ContractAbi,
    ContractArtifact,
    DecodedLogArgs,
    MethodAbi,
    TransactionReceiptWithDecodedLogs,
    TxData,
    TxDataPayable,
    SupportedProvider,
} from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
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
            assert.isString('takerAddress', takerAddress);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments('getOrderAndTraderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),address)', [order,
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
            const abiEncoder = self._lookupAbiEncoder('getOrderAndTraderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}, {makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            assert.isString('target', target);assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments('getBalanceAndAllowance(address,bytes)', [target,
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
            const abiEncoder = self._lookupAbiEncoder('getBalanceAndAllowance(address,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            assert.isArray('orders', orders);assert.isArray('takerAddresses', takerAddresses);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments('getOrdersAndTradersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address[])', [orders,
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
            const abiEncoder = self._lookupAbiEncoder('getOrdersAndTradersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[Array<{orderStatus: number;orderHash: string;orderTakerAssetFilledAmount: BigNumber}>, Array<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}>]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            assert.isArray('orders', orders);assert.isArray('takerAddresses', takerAddresses);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments('getTradersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address[])', [orders,
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
            const abiEncoder = self._lookupAbiEncoder('getTradersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<Array<{makerBalance: BigNumber;makerAllowance: BigNumber;takerBalance: BigNumber;takerAllowance: BigNumber;makerZrxBalance: BigNumber;makerZrxAllowance: BigNumber;takerZrxBalance: BigNumber;takerZrxAllowance: BigNumber}>
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            assert.isString('token', token);assert.isBigNumber('tokenId', tokenId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments('getERC721TokenOwner(address,uint256)', [token,
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
            const abiEncoder = self._lookupAbiEncoder('getERC721TokenOwner(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            assert.isString('target', target);assert.isArray('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments('getBalancesAndAllowances(address,bytes[])', [target,
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
            const abiEncoder = self._lookupAbiEncoder('getBalancesAndAllowances(address,bytes[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber[], BigNumber[]]
        >(rawCallResult);
            // tslint:enable boolean-naming
            return result;
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
            assert.isString('takerAddress', takerAddress);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = this as any as OrderValidatorContract;
            const encodedData = self._strictEncodeArguments('getTraderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),address)', [order,
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
            const abiEncoder = self._lookupAbiEncoder('getTraderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),address)');
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
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        if (artifact.compilerOutput === undefined) {
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
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
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
    constructor(abi: ContractAbi, address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>) {
        super('OrderValidator', abi, address, supportedProvider, txDefaults);
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', 'abi', '_web3Wrapper']);
    }
} // tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
