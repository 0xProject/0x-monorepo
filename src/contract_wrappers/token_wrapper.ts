import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {Web3Wrapper} from '../web3_wrapper';
import {assert} from '../utils/assert';
import {utils} from '../utils/utils';
import {eventUtils} from '../utils/event_utils';
import {constants} from '../utils/constants';
import {ContractWrapper} from './contract_wrapper';
import * as TokenArtifacts from '../artifacts/Token.json';
import * as TokenTransferProxyArtifacts from '../artifacts/TokenTransferProxy.json';
import {subscriptionOptsSchema} from '../schemas/subscription_opts_schema';
import {indexFilterValuesSchema} from '../schemas/index_filter_values_schema';
import {
    TokenContract,
    ZeroExError,
    TokenEvents,
    IndexedFilterValues,
    SubscriptionOpts,
    CreateContractEvent,
    ContractEventEmitter,
    ContractEventObj,
} from '../types';

const ALLOWANCE_TO_ZERO_GAS_AMOUNT = 47155;

/**
 * This class includes all the functionality related to interacting with ERC20 token contracts.
 * All ERC20 method calls are supported, along with some convenience methods for getting/setting allowances
 * to the 0x Proxy smart contract.
 */
export class TokenWrapper extends ContractWrapper {
    public UNLIMITED_ALLOWANCE_IN_BASE_UNITS = constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
    private _tokenContractsByAddress: {[address: string]: TokenContract};
    private _tokenLogEventEmitters: ContractEventEmitter[];
    constructor(web3Wrapper: Web3Wrapper) {
        super(web3Wrapper);
        this._tokenContractsByAddress = {};
        this._tokenLogEventEmitters = [];
    }
    /**
     * Retrieves an owner's ERC20 token balance.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address whose balance you would like to check.
     * @return  The owner's ERC20 token balance in base units.
     */
    public async getBalanceAsync(tokenAddress: string, ownerAddress: string): Promise<BigNumber.BigNumber> {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);

        const tokenContract = await this._getTokenContractAsync(tokenAddress);
        let balance = await tokenContract.balanceOf.call(ownerAddress);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        balance = new BigNumber(balance);
        return balance;
    }
    /**
     * Sets the spender's allowance to a specified number of baseUnits on behalf of the owner address.
     * Equivalent to the ERC20 spec method `approve`.
     * @param   tokenAddress        The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress        The hex encoded user Ethereum address who would like to set an allowance
     *                              for spenderAddress.
     * @param   spenderAddress      The hex encoded user Ethereum address who will be able to spend the set allowance.
     * @param   amountInBaseUnits   The allowance amount you would like to set.
     */
    public async setAllowanceAsync(tokenAddress: string, ownerAddress: string, spenderAddress: string,
                                   amountInBaseUnits: BigNumber.BigNumber): Promise<void> {
        await assert.isSenderAddressAsync('ownerAddress', ownerAddress, this._web3Wrapper);
        assert.isETHAddressHex('spenderAddress', spenderAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isBigNumber('amountInBaseUnits', amountInBaseUnits);

        const tokenContract = await this._getTokenContractAsync(tokenAddress);
        // Hack: for some reason default estimated gas amount causes `base fee exceeds gas limit` exception
        // on testrpc. Probably related to https://github.com/ethereumjs/testrpc/issues/294
        // TODO: Debug issue in testrpc and submit a PR, then remove this hack
        const networkIdIfExists = await this._web3Wrapper.getNetworkIdIfExistsAsync();
        const gas = networkIdIfExists === constants.TESTRPC_NETWORK_ID ? ALLOWANCE_TO_ZERO_GAS_AMOUNT : undefined;
        await tokenContract.approve(spenderAddress, amountInBaseUnits, {
            from: ownerAddress,
            gas,
        });
    }
    /**
     * Sets the spender's allowance to an unlimited number of baseUnits on behalf of the owner address.
     * Equivalent to the ERC20 spec method `approve`.
     * Setting an unlimited allowance will lower the gas cost for filling orders involving tokens that forego updating
     * allowances set to the max amount (e.g ZRX, WETH)
     * @param   tokenAddress        The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress        The hex encoded user Ethereum address who would like to set an allowance
     *                              for spenderAddress.
     * @param   spenderAddress      The hex encoded user Ethereum address who will be able to spend the set allowance.
     */
    public async setUnlimitedAllowanceAsync(tokenAddress: string, ownerAddress: string,
                                            spenderAddress: string): Promise<void> {
        await this.setAllowanceAsync(
            tokenAddress, ownerAddress, spenderAddress, this.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
        );
    }
    /**
     * Retrieves the owners allowance in baseUnits set to the spender's address.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address whose allowance to spenderAddress
     *                          you would like to retrieve.
     * @param   spenderAddress  The hex encoded user Ethereum address who can spend the allowance you are fetching.
     */
    public async getAllowanceAsync(tokenAddress: string, ownerAddress: string, spenderAddress: string) {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);

        const tokenContract = await this._getTokenContractAsync(tokenAddress);
        let allowanceInBaseUnits = await tokenContract.allowance.call(ownerAddress, spenderAddress);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        allowanceInBaseUnits = new BigNumber(allowanceInBaseUnits);
        return allowanceInBaseUnits;
    }
    /**
     * Retrieves the owner's allowance in baseUnits set to the 0x proxy contract.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address whose proxy contract allowance we are retrieving.
     */
    public async getProxyAllowanceAsync(tokenAddress: string, ownerAddress: string) {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);

        const proxyAddress = await this._getProxyAddressAsync();
        const allowanceInBaseUnits = await this.getAllowanceAsync(tokenAddress, ownerAddress, proxyAddress);
        return allowanceInBaseUnits;
    }
    /**
     * Sets the 0x proxy contract's allowance to a specified number of a tokens' baseUnits on behalf
     * of an owner address.
     * @param   tokenAddress        The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress        The hex encoded user Ethereum address who is setting an allowance
     *                              for the Proxy contract.
     * @param   amountInBaseUnits   The allowance amount specified in baseUnits.
     */
    public async setProxyAllowanceAsync(tokenAddress: string, ownerAddress: string,
                                        amountInBaseUnits: BigNumber.BigNumber): Promise<void> {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isBigNumber('amountInBaseUnits', amountInBaseUnits);

        const proxyAddress = await this._getProxyAddressAsync();
        await this.setAllowanceAsync(tokenAddress, ownerAddress, proxyAddress, amountInBaseUnits);
    }
    /**
     * Sets the 0x proxy contract's allowance to a unlimited number of a tokens' baseUnits on behalf
     * of an owner address.
     * Setting an unlimited allowance will lower the gas cost for filling orders involving tokens that forego updating
     * allowances set to the max amount (e.g ZRX, WETH)
     * @param   tokenAddress        The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress        The hex encoded user Ethereum address who is setting an allowance
     *                              for the Proxy contract.
     */
    public async setUnlimitedProxyAllowanceAsync(tokenAddress: string, ownerAddress: string): Promise<void> {
        await this.setProxyAllowanceAsync(tokenAddress, ownerAddress, this.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
    }
    /**
     * Transfers `amountInBaseUnits` ERC20 tokens from `fromAddress` to `toAddress`.
     * @param   tokenAddress        The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   fromAddress         The hex encoded user Ethereum address that will send the funds.
     * @param   toAddress           The hex encoded user Ethereum address that will receive the funds.
     * @param   amountInBaseUnits   The amount (specified in baseUnits) of the token to transfer.
     */
    public async transferAsync(tokenAddress: string, fromAddress: string, toAddress: string,
                               amountInBaseUnits: BigNumber.BigNumber): Promise<void> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        await assert.isSenderAddressAsync('fromAddress', fromAddress, this._web3Wrapper);
        assert.isETHAddressHex('toAddress', toAddress);
        assert.isBigNumber('amountInBaseUnits', amountInBaseUnits);

        const tokenContract = await this._getTokenContractAsync(tokenAddress);

        const fromAddressBalance = await this.getBalanceAsync(tokenAddress, fromAddress);
        if (fromAddressBalance.lessThan(amountInBaseUnits)) {
            throw new Error(ZeroExError.InsufficientBalanceForTransfer);
        }

        await tokenContract.transfer(toAddress, amountInBaseUnits, {
            from: fromAddress,
        });
    }
    /**
     * Transfers `amountInBaseUnits` ERC20 tokens from `fromAddress` to `toAddress`.
     * Requires the fromAddress to have sufficient funds and to have approved an allowance of
     * `amountInBaseUnits` to `senderAddress`.
     * @param   tokenAddress        The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   fromAddress         The hex encoded user Ethereum address whose funds are being sent.
     * @param   toAddress           The hex encoded user Ethereum address that will receive the funds.
     * @param   senderAddress       The hex encoded user Ethereum address whose initiates the fund transfer. The
     *                              `fromAddress` must have set an allowance to the `senderAddress`
     *                              before this call.
     * @param   amountInBaseUnits   The amount (specified in baseUnits) of the token to transfer.
     */
    public async transferFromAsync(tokenAddress: string, fromAddress: string, toAddress: string,
                                   senderAddress: string, amountInBaseUnits: BigNumber.BigNumber):
                                   Promise<void> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('fromAddress', fromAddress);
        assert.isETHAddressHex('toAddress', toAddress);
        await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper);
        assert.isBigNumber('amountInBaseUnits', amountInBaseUnits);

        const tokenContract = await this._getTokenContractAsync(tokenAddress);

        const fromAddressAllowance = await this.getAllowanceAsync(tokenAddress, fromAddress, senderAddress);
        if (fromAddressAllowance.lessThan(amountInBaseUnits)) {
            throw new Error(ZeroExError.InsufficientAllowanceForTransfer);
        }

        const fromAddressBalance = await this.getBalanceAsync(tokenAddress, fromAddress);
        if (fromAddressBalance.lessThan(amountInBaseUnits)) {
            throw new Error(ZeroExError.InsufficientBalanceForTransfer);
        }

        await tokenContract.transferFrom(fromAddress, toAddress, amountInBaseUnits, {
            from: senderAddress,
        });
    }
    /**
     * Subscribe to an event type emitted by the Token contract.
     * @param   tokenAddress        The hex encoded address where the ERC20 token is deployed.
     * @param   eventName           The token contract event you would like to subscribe to.
     * @param   subscriptionOpts    Subscriptions options that let you configure the subscription.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @return ContractEventEmitter object
     */
    public async subscribeAsync(tokenAddress: string, eventName: TokenEvents, subscriptionOpts: SubscriptionOpts,
                                indexFilterValues: IndexedFilterValues): Promise<ContractEventEmitter> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.doesBelongToStringEnum('eventName', eventName, TokenEvents);
        assert.doesConformToSchema('subscriptionOpts', subscriptionOpts, subscriptionOptsSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, indexFilterValuesSchema);
        const tokenContract = await this._getTokenContractAsync(tokenAddress);
        let createLogEvent: CreateContractEvent;
        switch (eventName) {
            case TokenEvents.Approval:
                createLogEvent = tokenContract.Approval;
                break;
            case TokenEvents.Transfer:
                createLogEvent = tokenContract.Transfer;
                break;
            default:
                throw utils.spawnSwitchErr('TokenEvents', eventName);
        }

        const logEventObj: ContractEventObj = createLogEvent(indexFilterValues, subscriptionOpts);
        const eventEmitter = eventUtils.wrapEventEmitter(logEventObj);
        this._tokenLogEventEmitters.push(eventEmitter);
        return eventEmitter;
    }
    /**
     * Stops watching for all token events
     */
    public async stopWatchingAllEventsAsync(): Promise<void> {
        const stopWatchingPromises = _.map(this._tokenLogEventEmitters,
                                           logEventObj => logEventObj.stopWatchingAsync());
        await Promise.all(stopWatchingPromises);
        this._tokenLogEventEmitters = [];
    }
    private async _invalidateContractInstancesAsync(): Promise<void> {
        await this.stopWatchingAllEventsAsync();
        this._tokenContractsByAddress = {};
    }
    private async _getTokenContractAsync(tokenAddress: string): Promise<TokenContract> {
        let tokenContract = this._tokenContractsByAddress[tokenAddress];
        if (!_.isUndefined(tokenContract)) {
            return tokenContract;
        }
        const contractInstance = await this._instantiateContractIfExistsAsync((TokenArtifacts as any), tokenAddress);
        tokenContract = contractInstance as TokenContract;
        this._tokenContractsByAddress[tokenAddress] = tokenContract;
        return tokenContract;
    }
    private async _getProxyAddressAsync() {
        const networkIdIfExists = await this._web3Wrapper.getNetworkIdIfExistsAsync();
        const proxyNetworkConfigsIfExists = _.isUndefined(networkIdIfExists) ?
                                       undefined :
                                       (TokenTransferProxyArtifacts as any).networks[networkIdIfExists];
        if (_.isUndefined(proxyNetworkConfigsIfExists)) {
            throw new Error(ZeroExError.ContractNotDeployedOnNetwork);
        }
        const proxyAddress = proxyNetworkConfigsIfExists.address.toLowerCase();
        return proxyAddress;
    }
}
