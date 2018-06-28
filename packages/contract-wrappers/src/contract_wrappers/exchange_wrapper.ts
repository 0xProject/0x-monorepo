import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { ContractAbi, LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { BlockRange, EventCallback, IndexedFilterValues, MethodOpts, OrderTransactionOpts } from '../types';
import { assert } from '../utils/assert';
import { decorators } from '../utils/decorators';

import { ContractWrapper } from './contract_wrapper';
import { ExchangeContract, ExchangeEventArgs, ExchangeEvents } from './generated/exchange';

/**
 * This class includes all the functionality related to calling methods and subscribing to
 * events of the 0x Exchange smart contract.
 */
export class ExchangeWrapper extends ContractWrapper {
    public abi: ContractAbi = artifacts.Exchange.compilerOutput.abi;
    private _exchangeContractIfExists?: ExchangeContract;
    private _contractAddressIfExists?: string;
    private _zrxContractAddressIfExists?: string;
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        contractAddressIfExists?: string,
        zrxContractAddressIfExists?: string,
    ) {
        super(web3Wrapper, networkId);
        this._contractAddressIfExists = contractAddressIfExists;
        this._zrxContractAddressIfExists = zrxContractAddressIfExists;
    }
    /**
     * Retrieve the takerAmount of an order that has already been filled.
     * @param   orderHash    The hex encoded orderHash for which you would like to retrieve the filled takerAmount.
     * @param   methodOpts   Optional arguments this method accepts.
     * @return  The amount of the order (in taker tokens) that has already been filled.
     */
    public async getFilledTakerAmountAsync(orderHash: string, methodOpts?: MethodOpts): Promise<BigNumber> {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);

        const exchangeContract = await this._getExchangeContractAsync();
        const defaultBlock = _.isUndefined(methodOpts) ? undefined : methodOpts.defaultBlock;
        const txData = {};
        let fillAmountInBaseUnits = await exchangeContract.filled.callAsync(orderHash, txData, defaultBlock);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        fillAmountInBaseUnits = new BigNumber(fillAmountInBaseUnits);
        return fillAmountInBaseUnits;
    }
    /**
     * Check if the order has been cancelled.
     * @param   orderHash    The hex encoded orderHash for which you would like to retrieve the
     *                       cancelled takerAmount.
     * @param   methodOpts   Optional arguments this method accepts.
     * @return  If the order has been cancelled.
     */
    public async isCancelledAsync(orderHash: string, methodOpts?: MethodOpts): Promise<boolean> {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);

        const exchangeContract = await this._getExchangeContractAsync();
        const defaultBlock = _.isUndefined(methodOpts) ? undefined : methodOpts.defaultBlock;
        const txData = {};
        const isCancelled = await exchangeContract.cancelled.callAsync(orderHash, txData, defaultBlock);
        return isCancelled;
    }
    /**
     * Fills a signed order with an amount denominated in baseUnits of the taker token.
     * Since the order in which transactions are included in the next block is indeterminate, race-conditions
     * could arise where a users balance or allowance changes before the fillOrder executes. Because of this,
     * we allow you to specify `shouldThrowOnInsufficientBalanceOrAllowance`.
     * If false, the smart contract will not throw if the parties
     * do not have sufficient balances/allowances, preserving gas costs. Setting it to true forgoes this check
     * and causes the smart contract to throw (using all the gas supplied) instead.
     * @param   signedOrder                                 An object that conforms to the SignedOrder interface.
     * @param   fillTakerTokenAmount                        The amount of the order (in taker tokens baseUnits) that
     *                                                      you wish to fill.
     * @param   shouldThrowOnInsufficientBalanceOrAllowance Whether or not you wish for the contract call to throw
     *                                                      if upon execution the tokens cannot be transferred.
     * @param   takerAddress                                The user Ethereum address who would like to fill this order.
     *                                                      Must be available via the supplied Provider
     *                                                      passed to 0x.js.
     * @param   orderTransactionOpts                        Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        fillTakerTokenAmount: BigNumber,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = {},
    ): Promise<string> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('fillTakerTokenAmount', fillTakerTokenAmount);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        const exchangeInstance = await this._getExchangeContractAsync();

        const txHash: string = await exchangeInstance.fillOrder.sendTransactionAsync(
            signedOrder,
            fillTakerTokenAmount,
            signedOrder.signature,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            },
        );
        return txHash;
    }
    /**
     * Subscribe to an event type emitted by the Exchange contract.
     * @param   eventName           The exchange contract event you would like to subscribe to.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param   callback            Callback that gets called when a log is added/removed
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ExchangeEventArgs>(
        eventName: ExchangeEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const exchangeContractAddress = this.getContractAddress();
        const subscriptionToken = this._subscribe<ArgsType>(
            exchangeContractAddress,
            eventName,
            indexFilterValues,
            artifacts.Exchange.compilerOutput.abi,
            callback,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param   subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        this._unsubscribe(subscriptionToken);
    }
    /**
     * Cancels all existing subscriptions
     */
    public unsubscribeAll(): void {
        super._unsubscribeAll();
    }
    /**
     * Gets historical logs without creating a subscription
     * @param   eventName           The exchange contract event you would like to subscribe to.
     * @param   blockRange          Block range to get logs from.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ExchangeEventArgs>(
        eventName: ExchangeEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const exchangeContractAddress = this.getContractAddress();
        const logs = await this._getLogsAsync<ArgsType>(
            exchangeContractAddress,
            eventName,
            blockRange,
            indexFilterValues,
            artifacts.Exchange.compilerOutput.abi,
        );
        return logs;
    }
    /**
     * Retrieves the Ethereum address of the Exchange contract deployed on the network
     * that the user-passed web3 provider is connected to.
     * @returns The Ethereum address of the Exchange contract being used.
     */
    public getContractAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.Exchange, this._contractAddressIfExists);
        return contractAddress;
    }
    /**
     * Returns the ZRX token address used by the exchange contract.
     * @return Address of ZRX token
     */
    public getZRXTokenAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.ZRXToken, this._zrxContractAddressIfExists);
        return contractAddress;
    }
    // tslint:disable:no-unused-variable
    private _invalidateContractInstances(): void {
        this.unsubscribeAll();
        delete this._exchangeContractIfExists;
    }
    // tslint:enable:no-unused-variable
    private async _getExchangeContractAsync(): Promise<ExchangeContract> {
        if (!_.isUndefined(this._exchangeContractIfExists)) {
            return this._exchangeContractIfExists;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.Exchange,
            this._contractAddressIfExists,
        );
        const contractInstance = new ExchangeContract(
            abi,
            address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._exchangeContractIfExists = contractInstance;
        return this._exchangeContractIfExists;
    }
} // tslint:disable:max-file-line-count
