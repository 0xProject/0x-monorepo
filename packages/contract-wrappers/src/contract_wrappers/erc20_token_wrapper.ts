import { artifacts, wrappers } from '@0xproject/contracts';
import { schemas } from '@0xproject/json-schemas';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { ContractAbi, LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { methodOptsSchema } from '../schemas/method_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import {
    BlockRange,
    ContractWrappersError,
    EventCallback,
    IndexedFilterValues,
    MethodOpts,
    TransactionOpts,
} from '../types';
import { assert } from '../utils/assert';
import { constants } from '../utils/constants';

import { ContractWrapper } from './contract_wrapper';
import { ERC20ProxyWrapper } from './erc20_proxy_wrapper';

const removeUndefinedProperties = _.pickBy;

/**
 * This class includes all the functionality related to interacting with ERC20 token contracts.
 * All ERC20 method calls are supported, along with some convenience methods for getting/setting allowances
 * to the 0x ERC20 Proxy smart contract.
 */
export class ERC20TokenWrapper extends ContractWrapper {
    public abi: ContractAbi = artifacts.ERC20Token.compilerOutput.abi;
    public UNLIMITED_ALLOWANCE_IN_BASE_UNITS = constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
    private _tokenContractsByAddress: { [address: string]: wrappers.ERC20TokenContract };
    private _erc20ProxyWrapper: ERC20ProxyWrapper;
    /**
     * Instantiate ERC20TokenWrapper
     * @param web3Wrapper Web3Wrapper instance to use
     * @param networkId Desired networkId
     * @param erc20ProxyWrapper The ERC20ProxyWrapper instance to use
     * @param blockPollingIntervalMs The block polling interval to use for active subscriptions
     */
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        erc20ProxyWrapper: ERC20ProxyWrapper,
        blockPollingIntervalMs?: number,
    ) {
        super(web3Wrapper, networkId, blockPollingIntervalMs);
        this._tokenContractsByAddress = {};
        this._erc20ProxyWrapper = erc20ProxyWrapper;
    }
    /**
     * Retrieves an owner's ERC20 token balance.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address whose balance you would like to check.
     * @param   methodOpts      Optional arguments this method accepts.
     * @return  The owner's ERC20 token balance in base units.
     */
    public async getBalanceAsync(
        tokenAddress: string,
        ownerAddress: string,
        methodOpts: MethodOpts = {},
    ): Promise<BigNumber> {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);

        const txData = {};
        let balance = await tokenContract.balanceOf.callAsync(normalizedOwnerAddress, txData, methodOpts.defaultBlock);
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
     * @param   txOpts              Transaction parameters.
     * @return Transaction hash.
     */
    public async setAllowanceAsync(
        tokenAddress: string,
        ownerAddress: string,
        spenderAddress: string,
        amountInBaseUnits: BigNumber,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        await assert.isSenderAddressAsync('ownerAddress', ownerAddress, this._web3Wrapper);
        assert.isETHAddressHex('spenderAddress', spenderAddress);
        assert.isValidBaseUnitAmount('amountInBaseUnits', amountInBaseUnits);
        assert.doesConformToSchema('txOpts', txOpts, txOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();
        const normalizedSpenderAddress = spenderAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);
        const txHash = await tokenContract.approve.sendTransactionAsync(
            normalizedSpenderAddress,
            amountInBaseUnits,
            removeUndefinedProperties({
                from: normalizedOwnerAddress,
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
            }),
        );
        return txHash;
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
     * @param   txOpts              Transaction parameters.
     * @return Transaction hash.
     */
    public async setUnlimitedAllowanceAsync(
        tokenAddress: string,
        ownerAddress: string,
        spenderAddress: string,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        const txHash = await this.setAllowanceAsync(
            tokenAddress,
            ownerAddress,
            spenderAddress,
            this.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            txOpts,
        );
        return txHash;
    }
    /**
     * Retrieves the owners allowance in baseUnits set to the spender's address.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address whose allowance to spenderAddress
     *                          you would like to retrieve.
     * @param   spenderAddress  The hex encoded user Ethereum address who can spend the allowance you are fetching.
     * @param   methodOpts      Optional arguments this method accepts.
     */
    public async getAllowanceAsync(
        tokenAddress: string,
        ownerAddress: string,
        spenderAddress: string,
        methodOpts: MethodOpts = {},
    ): Promise<BigNumber> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('spenderAddress', spenderAddress);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();
        const normalizedSpenderAddress = spenderAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);

        const txData = {};
        let allowanceInBaseUnits = await tokenContract.allowance.callAsync(
            normalizedOwnerAddress,
            normalizedSpenderAddress,
            txData,
            methodOpts.defaultBlock,
        );
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        allowanceInBaseUnits = new BigNumber(allowanceInBaseUnits);
        return allowanceInBaseUnits;
    }
    /**
     * Retrieves the owner's allowance in baseUnits set to the 0x proxy contract.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address whose proxy contract allowance we are retrieving.
     * @param   methodOpts      Optional arguments this method accepts.
     */
    public async getProxyAllowanceAsync(
        tokenAddress: string,
        ownerAddress: string,
        methodOpts: MethodOpts = {},
    ): Promise<BigNumber> {
        const proxyAddress = this._erc20ProxyWrapper.getContractAddress();
        const allowanceInBaseUnits = await this.getAllowanceAsync(tokenAddress, ownerAddress, proxyAddress, methodOpts);
        return allowanceInBaseUnits;
    }
    /**
     * Sets the 0x proxy contract's allowance to a specified number of a tokens' baseUnits on behalf
     * of an owner address.
     * @param   tokenAddress        The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress        The hex encoded user Ethereum address who is setting an allowance
     *                              for the Proxy contract.
     * @param   amountInBaseUnits   The allowance amount specified in baseUnits.
     * @param   txOpts              Transaction parameters.
     * @return Transaction hash.
     */
    public async setProxyAllowanceAsync(
        tokenAddress: string,
        ownerAddress: string,
        amountInBaseUnits: BigNumber,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        const proxyAddress = this._erc20ProxyWrapper.getContractAddress();
        const txHash = await this.setAllowanceAsync(
            tokenAddress,
            ownerAddress,
            proxyAddress,
            amountInBaseUnits,
            txOpts,
        );
        return txHash;
    }
    /**
     * Sets the 0x proxy contract's allowance to a unlimited number of a tokens' baseUnits on behalf
     * of an owner address.
     * Setting an unlimited allowance will lower the gas cost for filling orders involving tokens that forego updating
     * allowances set to the max amount (e.g ZRX, WETH)
     * @param   tokenAddress        The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   ownerAddress        The hex encoded user Ethereum address who is setting an allowance
     *                              for the Proxy contract.
     * @param   txOpts              Transaction parameters.
     * @return Transaction hash.
     */
    public async setUnlimitedProxyAllowanceAsync(
        tokenAddress: string,
        ownerAddress: string,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        const txHash = await this.setProxyAllowanceAsync(
            tokenAddress,
            ownerAddress,
            this.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            txOpts,
        );
        return txHash;
    }
    /**
     * Transfers `amountInBaseUnits` ERC20 tokens from `fromAddress` to `toAddress`.
     * @param   tokenAddress        The hex encoded contract Ethereum address where the ERC20 token is deployed.
     * @param   fromAddress         The hex encoded user Ethereum address that will send the funds.
     * @param   toAddress           The hex encoded user Ethereum address that will receive the funds.
     * @param   amountInBaseUnits   The amount (specified in baseUnits) of the token to transfer.
     * @param   txOpts              Transaction parameters.
     * @return Transaction hash.
     */
    public async transferAsync(
        tokenAddress: string,
        fromAddress: string,
        toAddress: string,
        amountInBaseUnits: BigNumber,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        await assert.isSenderAddressAsync('fromAddress', fromAddress, this._web3Wrapper);
        assert.isETHAddressHex('toAddress', toAddress);
        assert.isValidBaseUnitAmount('amountInBaseUnits', amountInBaseUnits);
        assert.doesConformToSchema('txOpts', txOpts, txOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedFromAddress = fromAddress.toLowerCase();
        const normalizedToAddress = toAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);

        const fromAddressBalance = await this.getBalanceAsync(normalizedTokenAddress, normalizedFromAddress);
        if (fromAddressBalance.lessThan(amountInBaseUnits)) {
            throw new Error(ContractWrappersError.InsufficientBalanceForTransfer);
        }

        const txHash = await tokenContract.transfer.sendTransactionAsync(
            normalizedToAddress,
            amountInBaseUnits,
            removeUndefinedProperties({
                from: normalizedFromAddress,
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
            }),
        );
        return txHash;
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
     * @param   txOpts              Transaction parameters.
     * @return Transaction hash.
     */
    public async transferFromAsync(
        tokenAddress: string,
        fromAddress: string,
        toAddress: string,
        senderAddress: string,
        amountInBaseUnits: BigNumber,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('fromAddress', fromAddress);
        assert.isETHAddressHex('toAddress', toAddress);
        await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper);
        assert.isValidBaseUnitAmount('amountInBaseUnits', amountInBaseUnits);
        assert.doesConformToSchema('txOpts', txOpts, txOptsSchema);
        const normalizedToAddress = toAddress.toLowerCase();
        const normalizedFromAddress = fromAddress.toLowerCase();
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedSenderAddress = senderAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);

        const fromAddressAllowance = await this.getAllowanceAsync(
            normalizedTokenAddress,
            normalizedFromAddress,
            normalizedSenderAddress,
        );
        if (fromAddressAllowance.lessThan(amountInBaseUnits)) {
            throw new Error(ContractWrappersError.InsufficientAllowanceForTransfer);
        }

        const fromAddressBalance = await this.getBalanceAsync(normalizedTokenAddress, normalizedFromAddress);
        if (fromAddressBalance.lessThan(amountInBaseUnits)) {
            throw new Error(ContractWrappersError.InsufficientBalanceForTransfer);
        }

        const txHash = await tokenContract.transferFrom.sendTransactionAsync(
            normalizedFromAddress,
            normalizedToAddress,
            amountInBaseUnits,
            removeUndefinedProperties({
                from: normalizedSenderAddress,
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
            }),
        );
        return txHash;
    }
    /**
     * Subscribe to an event type emitted by the Token contract.
     * @param   tokenAddress        The hex encoded address where the ERC20 token is deployed.
     * @param   eventName           The token contract event you would like to subscribe to.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param   callback            Callback that gets called when a log is added/removed
     * @param   isVerbose           Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends wrappers.ERC20TokenEventArgs>(
        tokenAddress: string,
        eventName: wrappers.ERC20TokenEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
    ): string {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.doesBelongToStringEnum('eventName', eventName, wrappers.ERC20TokenEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const subscriptionToken = this._subscribe<ArgsType>(
            normalizedTokenAddress,
            eventName,
            indexFilterValues,
            artifacts.ERC20Token.compilerOutput.abi,
            callback,
            isVerbose,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param   subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        assert.isValidSubscriptionToken('subscriptionToken', subscriptionToken);
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
     * @param   tokenAddress        An address of the token that emitted the logs.
     * @param   eventName           The token contract event you would like to subscribe to.
     * @param   blockRange          Block range to get logs from.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends wrappers.ERC20TokenEventArgs>(
        tokenAddress: string,
        eventName: wrappers.ERC20TokenEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.doesBelongToStringEnum('eventName', eventName, wrappers.ERC20TokenEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const logs = await this._getLogsAsync<ArgsType>(
            normalizedTokenAddress,
            eventName,
            blockRange,
            indexFilterValues,
            artifacts.ERC20Token.compilerOutput.abi,
        );
        return logs;
    }
    // HACK: We don't want this method to be visible to the other units within that package but not to the end user.
    // TS doesn't give that possibility and therefore we make it private and access it over an any cast. Because of that tslint sees it as unused.
    // tslint:disable-next-line:no-unused-variable
    private _invalidateContractInstances(): void {
        this.unsubscribeAll();
        this._tokenContractsByAddress = {};
    }
    private async _getTokenContractAsync(tokenAddress: string): Promise<wrappers.ERC20TokenContract> {
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        let tokenContract = this._tokenContractsByAddress[normalizedTokenAddress];
        if (!_.isUndefined(tokenContract)) {
            return tokenContract;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.ERC20Token,
            normalizedTokenAddress,
        );
        const contractInstance = new wrappers.ERC20TokenContract(
            abi,
            address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        tokenContract = contractInstance;
        this._tokenContractsByAddress[normalizedTokenAddress] = tokenContract;
        return tokenContract;
    }
}
