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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
         */
        getABIEncodedTransactionData(_tokenId: BigNumber): string {
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getApproved(uint256)', [_tokenId]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('getApproved(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
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
                self.approve.estimateGasAsync.bind(self, _approved.toLowerCase(), _tokenId),
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('approve(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('approve(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
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
                self.transferFrom.estimateGasAsync.bind(self, _from.toLowerCase(), _to.toLowerCase(), _tokenId),
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('transferFrom(address,address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('transferFrom(address,address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
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
                self.safeTransferFrom1.estimateGasAsync.bind(self, _from.toLowerCase(), _to.toLowerCase(), _tokenId),
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
         */
        getABIEncodedTransactionData(_tokenId: BigNumber): string {
            assert.isBigNumber('_tokenId', _tokenId);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ownerOf(uint256)', [_tokenId]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('ownerOf(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
         */
        getABIEncodedTransactionData(_owner: string): string {
            assert.isString('_owner', _owner);
            const self = (this as any) as ERC721TokenContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('balanceOf(address)', [_owner.toLowerCase()]);
            return abiEncodedTransactionData;
        },
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('balanceOf(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
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
                self.setApprovalForAll.estimateGasAsync.bind(self, _operator.toLowerCase(), _approved),
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('setApprovalForAll(address,bool)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('setApprovalForAll(address,bool)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
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
                self.safeTransferFrom2.estimateGasAsync.bind(
                    self,
                    _from.toLowerCase(),
                    _to.toLowerCase(),
                    _tokenId,
                    _data,
                ),
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
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

            const rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            BaseContract._throwIfRevertWithReasonCallResult(rawCallResult);
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
        getABIDecodedTransactionData(callData: string): boolean {
            const self = (this as any) as ERC721TokenContract;
            const abiEncoder = self._lookupAbiEncoder('isApprovedForAll(address,address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<boolean>(callData);
            return abiDecodedCallData;
        },
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
    ) {
        super('ERC721Token', ERC721TokenContract.ABI(), address, supportedProvider, txDefaults, logDecodeDependencies);
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
