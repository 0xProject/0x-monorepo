// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import {
    BaseContract,
    EventCallback,
    IndexedFilterValues,
    SubscriptionManager,
    PromiseWithTransactionHash,
} from '@0x/base-contract';
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
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

export type ERC721TokenEventArgs =
    | ERC721TokenTransferEventArgs
    | ERC721TokenApprovalEventArgs
    | ERC721TokenApprovalForAllEventArgs;

export enum ERC721TokenEvents {
    Transfer = 'Transfer',
    Approval = 'Approval',
    ApprovalForAll = 'ApprovalForAll',
}

export interface ERC721TokenTransferEventArgs extends DecodedLogArgs {
    _from: string;
    _to: string;
    _tokenId: BigNumber;
}

export interface ERC721TokenApprovalEventArgs extends DecodedLogArgs {
    _owner: string;
    _approved: string;
    _tokenId: BigNumber;
}

export interface ERC721TokenApprovalForAllEventArgs extends DecodedLogArgs {
    _owner: string;
    _operator: string;
    _approved: boolean;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ERC721TokenContract extends BaseContract {
    public static deployedBytecode =
        '0x608060405234801561001057600080fd5b50600436106100a35760003560e01c80636352211e11610076578063a22cb4651161005b578063a22cb46514610211578063b88d4fde1461024c578063e985e9c5146102e9576100a3565b80636352211e146101af57806370a08231146101cc576100a3565b8063081812fc146100a8578063095ea7b3146100ee57806323b872dd1461012957806342842e0e1461016c575b600080fd5b6100c5600480360360208110156100be57600080fd5b5035610338565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b6101276004803603604081101561010457600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135169060200135610360565b005b6101276004803603606081101561013f57600080fd5b5073ffffffffffffffffffffffffffffffffffffffff813581169160208101359091169060400135610482565b6101276004803603606081101561018257600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135811691602081013590911690604001356107ef565b6100c5600480360360208110156101c557600080fd5b5035610989565b6101ff600480360360208110156101e257600080fd5b503573ffffffffffffffffffffffffffffffffffffffff16610a20565b60408051918252519081900360200190f35b6101276004803603604081101561022757600080fd5b5073ffffffffffffffffffffffffffffffffffffffff81351690602001351515610acd565b6101276004803603608081101561026257600080fd5b73ffffffffffffffffffffffffffffffffffffffff8235811692602081013590911691604082013591908101906080810160608201356401000000008111156102aa57600080fd5b8201836020820111156102bc57600080fd5b803590602001918460018302840111640100000000831117156102de57600080fd5b509092509050610b66565b610324600480360360408110156102ff57600080fd5b5073ffffffffffffffffffffffffffffffffffffffff81358116916020013516610d31565b604080519115158252519081900360200190f35b60009081526001602052604090205473ffffffffffffffffffffffffffffffffffffffff1690565b600061036b82610989565b90503373ffffffffffffffffffffffffffffffffffffffff8216148061039657506103968133610d31565b61040157604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601560248201527f4552433732315f494e56414c49445f53454e4445520000000000000000000000604482015290519081900360640190fd5b60008281526001602052604080822080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff87811691821790925591518593918516917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92591a4505050565b73ffffffffffffffffffffffffffffffffffffffff821661050457604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601660248201527f4552433732315f5a45524f5f544f5f4144445245535300000000000000000000604482015290519081900360640190fd5b600061050f82610989565b90508073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16146105ab57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601560248201527f4552433732315f4f574e45525f4d49534d415443480000000000000000000000604482015290519081900360640190fd5b3360006105b784610338565b90508273ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614806105f857506105f88383610d31565b8061062e57508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16145b61069957604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601660248201527f4552433732315f494e56414c49445f5350454e44455200000000000000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff8116156106ea57600084815260016020526040902080547fffffffffffffffffffffffff00000000000000000000000000000000000000001690555b60008481526020818152604080832080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff8a811691909117909155891683526002909152902054610753906001610d6c565b73ffffffffffffffffffffffffffffffffffffffff8088166000908152600260205260408082209390935590871681522054610790906001610d90565b73ffffffffffffffffffffffffffffffffffffffff808716600081815260026020526040808220949094559251879391928a16917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4505050505050565b6107fa838383610482565b813b801561098357604080517f150b7a0200000000000000000000000000000000000000000000000000000000815233600482015273ffffffffffffffffffffffffffffffffffffffff8681166024830152604482018590526080606483015260006084830181905292519086169163150b7a029160c480830192602092919082900301818787803b15801561088f57600080fd5b505af11580156108a3573d6000803e3d6000fd5b505050506040513d60208110156108b957600080fd5b505160405190915080602f610e5b8239602f01905060405180910390207bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19161461098157604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601760248201527f4552433732315f494e56414c49445f53454c4543544f52000000000000000000604482015290519081900360640190fd5b505b50505050565b60008181526020819052604081205473ffffffffffffffffffffffffffffffffffffffff1680610a1a57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601160248201527f4552433732315f5a45524f5f4f574e4552000000000000000000000000000000604482015290519081900360640190fd5b92915050565b600073ffffffffffffffffffffffffffffffffffffffff8216610aa457604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601160248201527f4552433732315f5a45524f5f4f574e4552000000000000000000000000000000604482015290519081900360640190fd5b5073ffffffffffffffffffffffffffffffffffffffff1660009081526002602052604090205490565b33600081815260036020908152604080832073ffffffffffffffffffffffffffffffffffffffff87168085529083529281902080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0016861515908117909155815190815290519293927f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31929181900390910190a35050565b610b71858585610482565b833b8015610d29576040517f150b7a02000000000000000000000000000000000000000000000000000000008152336004820181815273ffffffffffffffffffffffffffffffffffffffff89811660248501526044840188905260806064850190815260848501879052600094918a169363150b7a029390928c928b928b928b929060a401848480828437600081840152601f19601f8201169050808301925050509650505050505050602060405180830381600087803b158015610c3557600080fd5b505af1158015610c49573d6000803e3d6000fd5b505050506040513d6020811015610c5f57600080fd5b505160405190915080602f610e5b8239602f01905060405180910390207bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614610d2757604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601760248201527f4552433732315f494e56414c49445f53454c4543544f52000000000000000000604482015290519081900360640190fd5b505b505050505050565b73ffffffffffffffffffffffffffffffffffffffff918216600090815260036020908152604080832093909416825291909152205460ff1690565b600082821115610d8a57610d8a610d8560028585610db3565b610e52565b50900390565b600082820183811015610dac57610dac610d8560008686610db3565b9392505050565b606063e946c1bb60e01b84848460405160240180846003811115610dd357fe5b60ff1681526020018381526020018281526020019350505050604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505090509392505050565b805160208201fdfe6f6e455243373231526563656976656428616464726573732c616464726573732c75696e743235362c627974657329a265627a7a72315820f19df649af87dc79d99cb6439a24ea2d10dfe47a300e66c99f0a0354b183378b64736f6c634300050b0032';
    /**
     * Throws if `_tokenId` is not a valid NFT.
     */
    public getApproved = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _tokenId The NFT to find the approved address for
         * @returns The approved address for this NFT, or the zero address if there is none
         */
        async callAsync(
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isBigNumber('_tokenId', _tokenId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('getApproved(uint256)', [_tokenId]);
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
            const abiEncoder = self._lookupAbiEncoder('getApproved(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _tokenId The NFT to find the approved address for
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_tokenId: BigNumber): string {
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getApproved(uint256)', [_tokenId]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('getApproved(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('getApproved(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * The zero address indicates there is no approved address.
     * Throws unless `msg.sender` is the current NFT owner, or an authorized
     * operator of the current owner.
     */
    public approve = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param _approved The new approved NFT controller
         * @param _tokenId The NFT to approve
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            _approved: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('_approved', _approved);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('approve(address,uint256)', [
                _approved.toLowerCase(),
                _tokenId,
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

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param _approved The new approved NFT controller
         * @param _tokenId The NFT to approve
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            _approved: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('_approved', _approved);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const txHashPromise = self.approve.sendTransactionAsync(_approved.toLowerCase(), _tokenId, txData);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param _approved The new approved NFT controller
         * @param _tokenId The NFT to approve
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            _approved: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('_approved', _approved);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('approve(address,uint256)', [
                _approved.toLowerCase(),
                _tokenId,
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
        async validateAndSendTransactionAsync(
            _approved: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).approve.callAsync(_approved, _tokenId, txData);
            const txHash = await (this as any).approve.sendTransactionAsync(_approved, _tokenId, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _approved The new approved NFT controller
         * @param _tokenId The NFT to approve
         */
        async callAsync(
            _approved: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('_approved', _approved);
            assert.isBigNumber('_tokenId', _tokenId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('approve(address,uint256)', [
                _approved.toLowerCase(),
                _tokenId,
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
            const abiEncoder = self._lookupAbiEncoder('approve(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _approved The new approved NFT controller
         * @param _tokenId The NFT to approve
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_approved: string, _tokenId: BigNumber): string {
            assert.isString('_approved', _approved);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('approve(address,uint256)', [
                _approved.toLowerCase(),
                _tokenId,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, BigNumber] {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('approve(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, BigNumber]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('approve(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Throws unless `msg.sender` is the current owner, an authorized
     * operator, or the approved address for this NFT. Throws if `_from` is
     * not the current owner. Throws if `_to` is the zero address. Throws if
     * `_tokenId` is not a valid NFT.
     */
    public transferFrom = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('transferFrom(address,address,uint256)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
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

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const txHashPromise = self.transferFrom.sendTransactionAsync(
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
                txData,
            );
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('transferFrom(address,address,uint256)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
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
        async validateAndSendTransactionAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).transferFrom.callAsync(_from, _to, _tokenId, txData);
            const txHash = await (this as any).transferFrom.sendTransactionAsync(_from, _to, _tokenId, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         */
        async callAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('transferFrom(address,address,uint256)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
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
            const abiEncoder = self._lookupAbiEncoder('transferFrom(address,address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_from: string, _to: string, _tokenId: BigNumber): string {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transferFrom(address,address,uint256)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, string, BigNumber] {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('transferFrom(address,address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, string, BigNumber]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('transferFrom(address,address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * This works identically to the other function with an extra data parameter,
     * except this function just sets data to "".
     */
    public safeTransferFrom1 = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
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

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const txHashPromise = self.safeTransferFrom1.sendTransactionAsync(
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
                txData,
            );
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
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
        async validateAndSendTransactionAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).safeTransferFrom1.callAsync(_from, _to, _tokenId, txData);
            const txHash = await (this as any).safeTransferFrom1.sendTransactionAsync(_from, _to, _tokenId, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         */
        async callAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
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
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_from: string, _to: string, _tokenId: BigNumber): string {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, string, BigNumber] {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, string, BigNumber]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * NFTs assigned to zero address are considered invalid, and queries
     * about them do throw.
     */
    public ownerOf = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _tokenId The identifier for an NFT
         * @returns The address of the owner of the NFT
         */
        async callAsync(
            _tokenId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isBigNumber('_tokenId', _tokenId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('ownerOf(uint256)', [_tokenId]);
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
            const abiEncoder = self._lookupAbiEncoder('ownerOf(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _tokenId The identifier for an NFT
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_tokenId: BigNumber): string {
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ownerOf(uint256)', [_tokenId]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('ownerOf(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('ownerOf(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * NFTs assigned to the zero address are considered invalid, and this
     * function throws for queries about the zero address.
     */
    public balanceOf = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _owner An address for whom to query the balance
         * @returns The number of NFTs owned by &#x60;_owner&#x60;, possibly zero
         */
        async callAsync(
            _owner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isString('_owner', _owner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('balanceOf(address)', [_owner.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('balanceOf(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _owner An address for whom to query the balance
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_owner: string): string {
            assert.isString('_owner', _owner);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('balanceOf(address)', [_owner.toLowerCase()]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('balanceOf(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('balanceOf(address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Emits the ApprovalForAll event. The contract MUST allow
     * multiple operators per owner.
     */
    public setApprovalForAll = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param _operator Address to add to the set of authorized operators
         * @param _approved True if the operator is approved, false to revoke approval
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            _operator: string,
            _approved: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('_operator', _operator);
            assert.isBoolean('_approved', _approved);
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                _operator.toLowerCase(),
                _approved,
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

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param _operator Address to add to the set of authorized operators
         * @param _approved True if the operator is approved, false to revoke approval
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            _operator: string,
            _approved: boolean,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('_operator', _operator);
            assert.isBoolean('_approved', _approved);
            const self = (this as any) as ERC721TokenContract;
            const txHashPromise = self.setApprovalForAll.sendTransactionAsync(
                _operator.toLowerCase(),
                _approved,
                txData,
            );
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param _operator Address to add to the set of authorized operators
         * @param _approved True if the operator is approved, false to revoke approval
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            _operator: string,
            _approved: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('_operator', _operator);
            assert.isBoolean('_approved', _approved);
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                _operator.toLowerCase(),
                _approved,
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
        async validateAndSendTransactionAsync(
            _operator: string,
            _approved: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).setApprovalForAll.callAsync(_operator, _approved, txData);
            const txHash = await (this as any).setApprovalForAll.sendTransactionAsync(_operator, _approved, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _operator Address to add to the set of authorized operators
         * @param _approved True if the operator is approved, false to revoke approval
         */
        async callAsync(
            _operator: string,
            _approved: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('_operator', _operator);
            assert.isBoolean('_approved', _approved);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                _operator.toLowerCase(),
                _approved,
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
            const abiEncoder = self._lookupAbiEncoder('setApprovalForAll(address,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _operator Address to add to the set of authorized operators
         * @param _approved True if the operator is approved, false to revoke approval
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_operator: string, _approved: boolean): string {
            assert.isString('_operator', _operator);
            assert.isBoolean('_approved', _approved);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                _operator.toLowerCase(),
                _approved,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, boolean] {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('setApprovalForAll(address,bool)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, boolean]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('setApprovalForAll(address,bool)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Throws unless `msg.sender` is the current owner, an authorized
     * operator, or the approved address for this NFT. Throws if `_from` is
     * not the current owner. Throws if `_to` is the zero address. Throws if
     * `_tokenId` is not a valid NFT. When transfer is complete, this function
     * checks if `_to` is a smart contract (code size > 0). If so, it calls
     * `onERC721Received` on `_to` and throws if the return value is not
     * `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
     */
    public safeTransferFrom2 = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param _data Additional data with no specified format, sent in call to `_to`
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            _data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            assert.isString('_data', _data);
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256,bytes)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
                _data,
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

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param _data Additional data with no specified format, sent in call to `_to`
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            _data: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            assert.isString('_data', _data);
            const self = (this as any) as ERC721TokenContract;
            const txHashPromise = self.safeTransferFrom2.sendTransactionAsync(
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
                _data,
                txData,
            );
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param _data Additional data with no specified format, sent in call to `_to`
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            _data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            assert.isString('_data', _data);
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256,bytes)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
                _data,
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
        async validateAndSendTransactionAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            _data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).safeTransferFrom2.callAsync(_from, _to, _tokenId, _data, txData);
            const txHash = await (this as any).safeTransferFrom2.sendTransactionAsync(
                _from,
                _to,
                _tokenId,
                _data,
                txData,
            );
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param _data Additional data with no specified format, sent in call to `_to`
         */
        async callAsync(
            _from: string,
            _to: string,
            _tokenId: BigNumber,
            _data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            assert.isString('_data', _data);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256,bytes)', [
                _from.toLowerCase(),
                _to.toLowerCase(),
                _tokenId,
                _data,
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
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _from The current owner of the NFT
         * @param _to The new owner
         * @param _tokenId The NFT to transfer
         * @param _data Additional data with no specified format, sent in call to `_to`
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_from: string, _to: string, _tokenId: BigNumber, _data: string): string {
            assert.isString('_from', _from);
            assert.isString('_to', _to);
            assert.isBigNumber('_tokenId', _tokenId);
            assert.isString('_data', _data);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'safeTransferFrom(address,address,uint256,bytes)',
                [_from.toLowerCase(), _to.toLowerCase(), _tokenId, _data],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, string, BigNumber, string] {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, string, BigNumber, string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public isApprovedForAll = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _owner The address that owns the NFTs
         * @param _operator The address that acts on behalf of the owner
         * @returns True if &#x60;_operator&#x60; is an approved operator for &#x60;_owner&#x60;, false otherwise
         */
        async callAsync(
            _owner: string,
            _operator: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isString('_owner', _owner);
            assert.isString('_operator', _operator);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC721TokenContract;
            const encodedData = self._strictEncodeArguments('isApprovedForAll(address,address)', [
                _owner.toLowerCase(),
                _operator.toLowerCase(),
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
            const abiEncoder = self._lookupAbiEncoder('isApprovedForAll(address,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _owner The address that owns the NFTs
         * @param _operator The address that acts on behalf of the owner
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_owner: string, _operator: string): string {
            assert.isString('_owner', _owner);
            assert.isString('_operator', _operator);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isApprovedForAll(address,address)', [
                _owner.toLowerCase(),
                _operator.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('isApprovedForAll(address,address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('isApprovedForAll(address,address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    private readonly _subscriptionManager: SubscriptionManager<ERC721TokenEventArgs, ERC721TokenEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<ERC721TokenContract> {
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
        return ERC721TokenContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<ERC721TokenContract> {
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
        logUtils.log(`ERC721Token successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ERC721TokenContract(
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
                constant: true,
                inputs: [
                    {
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'getApproved',
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
                        name: '_approved',
                        type: 'address',
                    },
                    {
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'approve',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_from',
                        type: 'address',
                    },
                    {
                        name: '_to',
                        type: 'address',
                    },
                    {
                        name: '_tokenId',
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
                        name: '_from',
                        type: 'address',
                    },
                    {
                        name: '_to',
                        type: 'address',
                    },
                    {
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'safeTransferFrom',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: '_tokenId',
                        type: 'uint256',
                    },
                ],
                name: 'ownerOf',
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
                        name: '_owner',
                        type: 'address',
                    },
                ],
                name: 'balanceOf',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
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
                        name: '_operator',
                        type: 'address',
                    },
                    {
                        name: '_approved',
                        type: 'bool',
                    },
                ],
                name: 'setApprovalForAll',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_from',
                        type: 'address',
                    },
                    {
                        name: '_to',
                        type: 'address',
                    },
                    {
                        name: '_tokenId',
                        type: 'uint256',
                    },
                    {
                        name: '_data',
                        type: 'bytes',
                    },
                ],
                name: 'safeTransferFrom',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                    },
                    {
                        name: '_operator',
                        type: 'address',
                    },
                ],
                name: 'isApprovedForAll',
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
                anonymous: false,
                inputs: [
                    {
                        name: '_from',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_to',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_tokenId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Transfer',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_approved',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_tokenId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Approval',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_operator',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_approved',
                        type: 'bool',
                        indexed: false,
                    },
                ],
                name: 'ApprovalForAll',
                outputs: [],
                type: 'event',
            },
        ] as ContractAbi;
        return abi;
    }
    /**
     * Subscribe to an event type emitted by the ERC721Token contract.
     * @param eventName The ERC721Token contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ERC721TokenEventArgs>(
        eventName: ERC721TokenEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ERC721TokenEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            ERC721TokenContract.ABI(),
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
     * @param eventName The ERC721Token contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ERC721TokenEventArgs>(
        eventName: ERC721TokenEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ERC721TokenEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            ERC721TokenContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = ERC721TokenContract.deployedBytecode,
    ) {
        super(
            'ERC721Token',
            ERC721TokenContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<ERC721TokenEventArgs, ERC721TokenEvents>(
            ERC721TokenContract.ABI(),
            this._web3Wrapper,
        );
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
