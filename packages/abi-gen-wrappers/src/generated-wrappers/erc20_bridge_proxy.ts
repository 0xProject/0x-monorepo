// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma enum-naming
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import { BaseContract, SubscriptionManager, PromiseWithTransactionHash } from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
    BlockRange,
    CallData,
    ContractAbi,
    ContractArtifact,
    DecodedLogArgs,
    LogWithDecodedArgs,
    MethodAbi,
    TransactionReceiptWithDecodedLogs,
    TxData,
    TxDataPayable,
    SupportedProvider,
} from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import {
    AwaitTransactionSuccessOpts,
    EventCallback,
    IndexedFilterValues,
    SendTransactionOpts,
    SimpleContractArtifact,
} from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

export type ERC20BridgeProxyEventArgs =
    | ERC20BridgeProxyAuthorizedAddressAddedEventArgs
    | ERC20BridgeProxyAuthorizedAddressRemovedEventArgs
    | ERC20BridgeProxyOwnershipTransferredEventArgs;

export enum ERC20BridgeProxyEvents {
    AuthorizedAddressAdded = 'AuthorizedAddressAdded',
    AuthorizedAddressRemoved = 'AuthorizedAddressRemoved',
    OwnershipTransferred = 'OwnershipTransferred',
}

export interface ERC20BridgeProxyAuthorizedAddressAddedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}

export interface ERC20BridgeProxyAuthorizedAddressRemovedEventArgs extends DecodedLogArgs {
    target: string;
    caller: string;
}

export interface ERC20BridgeProxyOwnershipTransferredEventArgs extends DecodedLogArgs {
    previousOwner: string;
    newOwner: string;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ERC20BridgeProxyContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode =
        '0x608060405234801561001057600080fd5b50600436106100c95760003560e01c8063a85e59e411610081578063d39de6e91161005b578063d39de6e914610182578063f2fde38b14610197578063fc124ebd146101aa576100c9565b8063a85e59e41461013a578063ae25532e1461014d578063b918161114610162576100c9565b806370712939116100b2578063707129391461010c5780638da5cb5b1461011f5780639ad2674414610127576100c9565b806342f1181e146100ce578063494503d4146100e3575b600080fd5b6100e16100dc366004610f27565b6101ca565b005b6100f66100f1366004611160565b6101de565b6040516101039190611190565b60405180910390f35b6100e161011a366004610f27565b610212565b6100f66102cc565b6100e1610135366004611032565b6102e8565b6100e16101483660046110f2565b6102fa565b6101556104f6565b60405161010391906112c5565b610175610170366004610f27565b61051b565b60405161010391906112ba565b61018a610530565b6040516101039190611261565b6100e16101a5366004610f27565b61059f565b6101bd6101b836600461109d565b610642565b6040516101039190611390565b6101d26106bc565b6101db81610705565b50565b600281815481106101eb57fe5b60009182526020909120015473ffffffffffffffffffffffffffffffffffffffff16905081565b61021a6106bc565b73ffffffffffffffffffffffffffffffffffffffff811660009081526001602052604090205460ff166102585761025861025382610836565b6108d5565b60005b6002548110156102c8578173ffffffffffffffffffffffffffffffffffffffff166002828154811061028957fe5b60009182526020909120015473ffffffffffffffffffffffffffffffffffffffff1614156102c0576102bb82826108dd565b6102c8565b60010161025b565b5050565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b6102f06106bc565b6102c882826108dd565b610302610b2c565b60008060606103566004898990508a8a8080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525092949392505063ffffffff610b4f169050565b8060200190516103699190810190610f5f565b925092509250600061037b8487610b8d565b905060008373ffffffffffffffffffffffffffffffffffffffff1663c2df82e6868a8a8a886040518663ffffffff1660e01b81526004016103c09594939291906111d8565b602060405180830381600087803b1580156103da57600080fd5b505af11580156103ee573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250610412919081019061105d565b90507fffffffff0000000000000000000000000000000000000000000000000000000081167fdc1600f30000000000000000000000000000000000000000000000000000000014610498576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161048f90611322565b60405180910390fd5b6104a28588610b8d565b6104b2838863ffffffff610c3916565b11156104ea576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161048f90611359565b50505050505050505050565b7fdc1600f3000000000000000000000000000000000000000000000000000000005b90565b60016020526000908152604090205460ff1681565b6060600280548060200260200160405190810160405280929190818152602001828054801561059557602002820191906000526020600020905b815473ffffffffffffffffffffffffffffffffffffffff16815260019091019060200180831161056a575b5050505050905090565b6105a76106bc565b73ffffffffffffffffffffffffffffffffffffffff81166105d2576105cd610253610c55565b6101db565b600080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff83169081178255604051909133917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a350565b60008061069460048686905087878080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525092949392505063ffffffff610b4f169050565b8060200190516106a79190810190610f43565b90506106b38184610b8d565b95945050505050565b60005473ffffffffffffffffffffffffffffffffffffffff163314610703576000546107039061025390339073ffffffffffffffffffffffffffffffffffffffff16610c8c565b565b73ffffffffffffffffffffffffffffffffffffffff811661072b5761072b610253610d2e565b73ffffffffffffffffffffffffffffffffffffffff811660009081526001602052604090205460ff16156107655761076561025382610d65565b73ffffffffffffffffffffffffffffffffffffffff8116600081815260016020819052604080832080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00168317905560028054928301815583527f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace90910180547fffffffffffffffffffffffff00000000000000000000000000000000000000001684179055513392917f3147867c59d17e8fa9d522465651d44aae0a9e38f902f3475b97e58072f0ed4c91a350565b606063eb5108a260e01b826040516024016108519190611190565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff00000000000000000000000000000000000000000000000000000000909316929092179091529050919050565b805160208201fd5b73ffffffffffffffffffffffffffffffffffffffff821660009081526001602052604090205460ff166109165761091661025383610836565b60025481106109315761093161025382600280549050610d80565b8173ffffffffffffffffffffffffffffffffffffffff166002828154811061095557fe5b60009182526020909120015473ffffffffffffffffffffffffffffffffffffffff16146109b7576109b76102536002838154811061098f57fe5b60009182526020909120015473ffffffffffffffffffffffffffffffffffffffff1684610d9d565b73ffffffffffffffffffffffffffffffffffffffff8216600090815260016020526040902080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00169055600280547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8101908110610a3257fe5b6000918252602090912001546002805473ffffffffffffffffffffffffffffffffffffffff9092169183908110610a6557fe5b600091825260209091200180547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055600280547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0190610ae49082610e99565b50604051339073ffffffffffffffffffffffffffffffffffffffff8416907f1f32c1b084e2de0713b8fb16bd46bb9df710a3dbeae2f3ca93af46e016dcc6b090600090a35050565b3360009081526001602052604090205460ff166107035761070361025333610dba565b606081831115610b6857610b6861025360008585610dd5565b8351821115610b8157610b816102536001848751610dd5565b50819003910190815290565b6040517f70a0823100000000000000000000000000000000000000000000000000000000815260009073ffffffffffffffffffffffffffffffffffffffff8416906370a0823190610be2908590600401611190565b60206040518083038186803b158015610bfa57600080fd5b505afa158015610c0e573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250610c329190810190611178565b9392505050565b600082820183811015610c3257610c3261025360008686610e7a565b60408051808201909152600481527fe69edc3e00000000000000000000000000000000000000000000000000000000602082015290565b6060631de45ad160e01b8383604051602401610ca99291906111b1565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff0000000000000000000000000000000000000000000000000000000090931692909217909152905092915050565b60408051808201909152600481527f57654fe400000000000000000000000000000000000000000000000000000000602082015290565b606063de16f1a060e01b826040516024016108519190611190565b606063e9f8377160e01b8383604051602401610ca9929190611399565b606063140a84db60e01b8383604051602401610ca99291906111b1565b606063b65a25b960e01b826040516024016108519190611190565b6060632800659560e01b848484604051602401610df493929190611314565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff000000000000000000000000000000000000000000000000000000009093169290921790915290509392505050565b606063e946c1bb60e01b848484604051602401610df4939291906112f2565b815481835581811115610ebd57600083815260209020610ebd918101908301610ec2565b505050565b61051891905b80821115610edc5760008155600101610ec8565b5090565b60008083601f840112610ef1578182fd5b50813567ffffffffffffffff811115610f08578182fd5b602083019150836020828501011115610f2057600080fd5b9250929050565b600060208284031215610f38578081fd5b8135610c32816113fe565b600060208284031215610f54578081fd5b8151610c32816113fe565b600080600060608486031215610f73578182fd5b8351610f7e816113fe565b6020850151909350610f8f816113fe565b604085015190925067ffffffffffffffff80821115610fac578283fd5b81860187601f820112610fbd578384fd5b8051925081831115610fcd578384fd5b610ffe60207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f860116016113a7565b9150828252876020848301011115611014578384fd5b6110258360208401602084016113ce565b5080925050509250925092565b60008060408385031215611044578182fd5b823561104f816113fe565b946020939093013593505050565b60006020828403121561106e578081fd5b81517fffffffff0000000000000000000000000000000000000000000000000000000081168114610c32578182fd5b6000806000604084860312156110b1578283fd5b833567ffffffffffffffff8111156110c7578384fd5b6110d386828701610ee0565b90945092505060208401356110e7816113fe565b809150509250925092565b600080600080600060808688031215611109578081fd5b853567ffffffffffffffff81111561111f578182fd5b61112b88828901610ee0565b909650945050602086013561113f816113fe565b9250604086013561114f816113fe565b949793965091946060013592915050565b600060208284031215611171578081fd5b5035919050565b600060208284031215611189578081fd5b5051919050565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b73ffffffffffffffffffffffffffffffffffffffff92831681529116602082015260400190565b600073ffffffffffffffffffffffffffffffffffffffff8088168352808716602084015280861660408401525083606083015260a0608083015282518060a084015261122b8160c08501602087016113ce565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169190910160c0019695505050505050565b602080825282518282018190526000918401906040840190835b818110156112af57835173ffffffffffffffffffffffffffffffffffffffff1683526020938401939092019160010161127b565b509095945050505050565b901515815260200190565b7fffffffff0000000000000000000000000000000000000000000000000000000091909116815260200190565b606081016004851061130057fe5b938152602081019290925260409091015290565b606081016008851061130057fe5b6020808252600d908201527f4252494447455f4641494c454400000000000000000000000000000000000000604082015260600190565b6020808252600f908201527f4252494447455f554e4445525041590000000000000000000000000000000000604082015260600190565b90815260200190565b918252602082015260400190565b60405181810167ffffffffffffffff811182821017156113c657600080fd5b604052919050565b60005b838110156113e95781810151838201526020016113d1565b838111156113f8576000848401525b50505050565b73ffffffffffffffffffffffffffffffffffffffff811681146101db57600080fdfea365627a7a723158208443fe55d18b7dc9cff24ff524db866409ee96cb967c5e055d122b01700b898d6c6578706572696d656e74616cf564736f6c634300050c0040';
    /**
     * Authorizes an address.
     */
    public addAuthorizedAddress = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param target Address to authorize.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            target: string,
            txData?: Partial<TxData> | undefined,
            opts: SendTransactionOpts = { shouldValidate: true },
        ): Promise<string> {
            assert.isString('target', target);
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('addAuthorizedAddress(address)', [target.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            if (opts.shouldValidate !== false) {
                await self.addAuthorizedAddress.callAsync(target, txDataWithDefaults);
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param target Address to authorize.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            target: string,
            txData?: Partial<TxData>,
            opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('target', target);
            const self = (this as any) as ERC20BridgeProxyContract;
            const txHashPromise = self.addAuthorizedAddress.sendTransactionAsync(target.toLowerCase(), txData, opts);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        opts.pollingIntervalMs,
                        opts.timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param target Address to authorize.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(target: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('target', target);
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('addAuthorizedAddress(address)', [target.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param target Address to authorize.
         */
        async callAsync(target: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('target', target);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('addAuthorizedAddress(address)', [target.toLowerCase()]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('addAuthorizedAddress(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param target Address to authorize.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(target: string): string {
            assert.isString('target', target);
            const self = (this as any) as ERC20BridgeProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('addAuthorizedAddress(address)', [
                target.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as ERC20BridgeProxyContract;
            const abiEncoder = self._lookupAbiEncoder('addAuthorizedAddress(address)');
            return abiEncoder.getSelector();
        },
    };
    public authorities = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('authorities(uint256)', [index_0]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('authorities(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public authorized = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isString('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('authorized(address)', [index_0.toLowerCase()]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('authorized(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Retrieves the balance of `owner` for this asset.
     */
    public balanceOf = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @returns balance The balance of the ERC20 token being transferred by this         asset proxy.
         */
        async callAsync(
            assetData: string,
            owner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isString('assetData', assetData);
            assert.isString('owner', owner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('balanceOf(bytes,address)', [
                assetData,
                owner.toLowerCase(),
            ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('balanceOf(bytes,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Gets all authorized addresses.
     */
    public getAuthorizedAddresses = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @returns Array of authorized addresses.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string[]> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('getAuthorizedAddresses()', []);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('getAuthorizedAddresses()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Gets the proxy id associated with this asset proxy.
     */
    public getProxyId = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @returns proxyId The proxy id.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('getProxyId()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('getProxyId()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public owner = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('owner()', []);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Removes authorizion of an address.
     */
    public removeAuthorizedAddress = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param target Address to remove authorization from.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            target: string,
            txData?: Partial<TxData> | undefined,
            opts: SendTransactionOpts = { shouldValidate: true },
        ): Promise<string> {
            assert.isString('target', target);
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [target.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            if (opts.shouldValidate !== false) {
                await self.removeAuthorizedAddress.callAsync(target, txDataWithDefaults);
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param target Address to remove authorization from.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            target: string,
            txData?: Partial<TxData>,
            opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('target', target);
            const self = (this as any) as ERC20BridgeProxyContract;
            const txHashPromise = self.removeAuthorizedAddress.sendTransactionAsync(target.toLowerCase(), txData, opts);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        opts.pollingIntervalMs,
                        opts.timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param target Address to remove authorization from.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(target: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('target', target);
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [target.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param target Address to remove authorization from.
         */
        async callAsync(target: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('target', target);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [target.toLowerCase()]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddress(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param target Address to remove authorization from.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(target: string): string {
            assert.isString('target', target);
            const self = (this as any) as ERC20BridgeProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('removeAuthorizedAddress(address)', [
                target.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as ERC20BridgeProxyContract;
            const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddress(address)');
            return abiEncoder.getSelector();
        },
    };
    /**
     * Removes authorizion of an address.
     */
    public removeAuthorizedAddressAtIndex = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param target Address to remove authorization from.
         * @param index Index of target in authorities array.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            target: string,
            index: BigNumber,
            txData?: Partial<TxData> | undefined,
            opts: SendTransactionOpts = { shouldValidate: true },
        ): Promise<string> {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddressAtIndex(address,uint256)', [
                target.toLowerCase(),
                index,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            if (opts.shouldValidate !== false) {
                await self.removeAuthorizedAddressAtIndex.callAsync(target, index, txDataWithDefaults);
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param target Address to remove authorization from.
         * @param index Index of target in authorities array.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            target: string,
            index: BigNumber,
            txData?: Partial<TxData>,
            opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as ERC20BridgeProxyContract;
            const txHashPromise = self.removeAuthorizedAddressAtIndex.sendTransactionAsync(
                target.toLowerCase(),
                index,
                txData,
                opts,
            );
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        opts.pollingIntervalMs,
                        opts.timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param target Address to remove authorization from.
         * @param index Index of target in authorities array.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            target: string,
            index: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddressAtIndex(address,uint256)', [
                target.toLowerCase(),
                index,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param target Address to remove authorization from.
         * @param index Index of target in authorities array.
         */
        async callAsync(
            target: string,
            index: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('removeAuthorizedAddressAtIndex(address,uint256)', [
                target.toLowerCase(),
                index,
            ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddressAtIndex(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param target Address to remove authorization from.
         * @param index Index of target in authorities array.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(target: string, index: BigNumber): string {
            assert.isString('target', target);
            assert.isBigNumber('index', index);
            const self = (this as any) as ERC20BridgeProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'removeAuthorizedAddressAtIndex(address,uint256)',
                [target.toLowerCase(), index],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as ERC20BridgeProxyContract;
            const abiEncoder = self._lookupAbiEncoder('removeAuthorizedAddressAtIndex(address,uint256)');
            return abiEncoder.getSelector();
        },
    };
    /**
     * Calls a bridge contract to transfer `amount` of ERC20 from `from`
     * to `to`. Asserts that the balance of `to` has increased by `amount`.
     */
    public transferFrom = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param assetData Abi-encoded data for this asset proxy encoded as:
         *     abi.encodeWithSelector(             bytes4 PROXY_ID,             address
         *     tokenAddress,             address bridgeAddress,             bytes
         *     bridgeData          )
         * @param from Address to transfer asset from.
         * @param to Address to transfer asset to.
         * @param amount Amount of asset to transfer.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
            opts: SendTransactionOpts = { shouldValidate: true },
        ): Promise<string> {
            assert.isString('assetData', assetData);
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('transferFrom(bytes,address,address,uint256)', [
                assetData,
                from.toLowerCase(),
                to.toLowerCase(),
                amount,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            if (opts.shouldValidate !== false) {
                await self.transferFrom.callAsync(assetData, from, to, amount, txDataWithDefaults);
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param assetData Abi-encoded data for this asset proxy encoded as:
         *     abi.encodeWithSelector(             bytes4 PROXY_ID,             address
         *     tokenAddress,             address bridgeAddress,             bytes
         *     bridgeData          )
         * @param from Address to transfer asset from.
         * @param to Address to transfer asset to.
         * @param amount Amount of asset to transfer.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            txData?: Partial<TxData>,
            opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetData', assetData);
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ERC20BridgeProxyContract;
            const txHashPromise = self.transferFrom.sendTransactionAsync(
                assetData,
                from.toLowerCase(),
                to.toLowerCase(),
                amount,
                txData,
                opts,
            );
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        opts.pollingIntervalMs,
                        opts.timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param assetData Abi-encoded data for this asset proxy encoded as:
         *     abi.encodeWithSelector(             bytes4 PROXY_ID,             address
         *     tokenAddress,             address bridgeAddress,             bytes
         *     bridgeData          )
         * @param from Address to transfer asset from.
         * @param to Address to transfer asset to.
         * @param amount Amount of asset to transfer.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('assetData', assetData);
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('transferFrom(bytes,address,address,uint256)', [
                assetData,
                from.toLowerCase(),
                to.toLowerCase(),
                amount,
            ]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param assetData Abi-encoded data for this asset proxy encoded as:
         *     abi.encodeWithSelector(             bytes4 PROXY_ID,             address
         *     tokenAddress,             address bridgeAddress,             bytes
         *     bridgeData          )
         * @param from Address to transfer asset from.
         * @param to Address to transfer asset to.
         * @param amount Amount of asset to transfer.
         */
        async callAsync(
            assetData: string,
            from: string,
            to: string,
            amount: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('assetData', assetData);
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('amount', amount);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('transferFrom(bytes,address,address,uint256)', [
                assetData,
                from.toLowerCase(),
                to.toLowerCase(),
                amount,
            ]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('transferFrom(bytes,address,address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetData Abi-encoded data for this asset proxy encoded as:
         *     abi.encodeWithSelector(             bytes4 PROXY_ID,             address
         *     tokenAddress,             address bridgeAddress,             bytes
         *     bridgeData          )
         * @param from Address to transfer asset from.
         * @param to Address to transfer asset to.
         * @param amount Amount of asset to transfer.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(assetData: string, from: string, to: string, amount: BigNumber): string {
            assert.isString('assetData', assetData);
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ERC20BridgeProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'transferFrom(bytes,address,address,uint256)',
                [assetData, from.toLowerCase(), to.toLowerCase(), amount],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as ERC20BridgeProxyContract;
            const abiEncoder = self._lookupAbiEncoder('transferFrom(bytes,address,address,uint256)');
            return abiEncoder.getSelector();
        },
    };
    public transferOwnership = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            newOwner: string,
            txData?: Partial<TxData> | undefined,
            opts: SendTransactionOpts = { shouldValidate: true },
        ): Promise<string> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            if (opts.shouldValidate !== false) {
                await self.transferOwnership.callAsync(newOwner, txDataWithDefaults);
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            newOwner: string,
            txData?: Partial<TxData>,
            opts: AwaitTransactionSuccessOpts = { shouldValidate: true },
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ERC20BridgeProxyContract;
            const txHashPromise = self.transferOwnership.sendTransactionAsync(newOwner.toLowerCase(), txData, opts);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        opts.pollingIntervalMs,
                        opts.timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(newOwner: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(newOwner: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('newOwner', newOwner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC20BridgeProxyContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(newOwner: string): string {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ERC20BridgeProxyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transferOwnership(address)', [
                newOwner.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Returns the 4 byte function selector as a hex string.
         */
        getSelector(): string {
            const self = (this as any) as ERC20BridgeProxyContract;
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            return abiEncoder.getSelector();
        },
    };
    private readonly _subscriptionManager: SubscriptionManager<ERC20BridgeProxyEventArgs, ERC20BridgeProxyEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<ERC20BridgeProxyContract> {
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
        const logDecodeDependenciesAbiOnly: { [contractName: string]: ContractAbi } = {};
        if (Object.keys(logDecodeDependencies) !== undefined) {
            for (const key of Object.keys(logDecodeDependencies)) {
                logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
            }
        }
        return ERC20BridgeProxyContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<ERC20BridgeProxyContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(constructorAbi.inputs, [], BaseContract._bigNumberToString);
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, []);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`ERC20BridgeProxy successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ERC20BridgeProxyContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [];
        return contractInstance;
    }

    /**
     * @returns      The contract ABI
     */
    public static ABI(): ContractAbi {
        const abi = [
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'caller',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'AuthorizedAddressAdded',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'caller',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'AuthorizedAddressRemoved',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'previousOwner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'newOwner',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'OwnershipTransferred',
                outputs: [],
                type: 'event',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                    },
                ],
                name: 'addAuthorizedAddress',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'authorities',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'address',
                    },
                ],
                name: 'authorized',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                    {
                        name: 'owner',
                        type: 'address',
                    },
                ],
                name: 'balanceOf',
                outputs: [
                    {
                        name: 'balance',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'getAuthorizedAddresses',
                outputs: [
                    {
                        name: '',
                        type: 'address[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'getProxyId',
                outputs: [
                    {
                        name: 'proxyId',
                        type: 'bytes4',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'owner',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                    },
                ],
                name: 'removeAuthorizedAddress',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'target',
                        type: 'address',
                    },
                    {
                        name: 'index',
                        type: 'uint256',
                    },
                ],
                name: 'removeAuthorizedAddressAtIndex',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                    {
                        name: 'from',
                        type: 'address',
                    },
                    {
                        name: 'to',
                        type: 'address',
                    },
                    {
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                name: 'transferFrom',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'newOwner',
                        type: 'address',
                    },
                ],
                name: 'transferOwnership',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
        ] as ContractAbi;
        return abi;
    }
    /**
     * Subscribe to an event type emitted by the ERC20BridgeProxy contract.
     * @param eventName The ERC20BridgeProxy contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ERC20BridgeProxyEventArgs>(
        eventName: ERC20BridgeProxyEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ERC20BridgeProxyEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            ERC20BridgeProxyContract.ABI(),
            callback,
            isVerbose,
            blockPollingIntervalMs,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        this._subscriptionManager.unsubscribe(subscriptionToken);
    }
    /**
     * Cancels all existing subscriptions
     */
    public unsubscribeAll(): void {
        this._subscriptionManager.unsubscribeAll();
    }
    /**
     * Gets historical logs without creating a subscription
     * @param eventName The ERC20BridgeProxy contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ERC20BridgeProxyEventArgs>(
        eventName: ERC20BridgeProxyEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ERC20BridgeProxyEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            ERC20BridgeProxyContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = ERC20BridgeProxyContract.deployedBytecode,
    ) {
        super(
            'ERC20BridgeProxy',
            ERC20BridgeProxyContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<ERC20BridgeProxyEventArgs, ERC20BridgeProxyEvents>(
            ERC20BridgeProxyContract.ABI(),
            this._web3Wrapper,
        );
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
