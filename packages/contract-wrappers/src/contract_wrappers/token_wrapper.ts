import { schemas } from '@0xproject/json-schemas';
import { LogWithDecodedArgs } from '@0xproject/types';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
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
import { TokenContract, TokenContractEventArgs, TokenEvents } from './generated/token';
import { TokenTransferProxyWrapper } from './token_transfer_proxy_wrapper';

/**
 * This class includes all the functionality related to interacting with ERC20 token contracts.
 * All ERC20 method calls are supported, along with some convenience methods for getting/setting allowances
 * to the 0x Proxy smart contract.
 */
export class TokenWrapper extends ContractWrapper {
    public UNLIMITED_ALLOWANCE_IN_BASE_UNITS = constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
    private _tokenContractsByAddress: { [address: string]: TokenContract };
    private _tokenTransferProxyWrapper: TokenTransferProxyWrapper;
    constructor(web3Wrapper: Web3Wrapper, networkId: number, tokenTransferProxyWrapper: TokenTransferProxyWrapper) {
        super(web3Wrapper, networkId);
        this._tokenContractsByAddress = {};
        this._tokenTransferProxyWrapper = tokenTransferProxyWrapper;
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
        methodOpts?: MethodOpts,
    ): Promise<BigNumber> {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);
        const defaultBlock = _.isUndefined(methodOpts) ? undefined : methodOpts.defaultBlock;
        const txData = {};
        let balance = await tokenContract.balanceOf.callAsync(normalizedOwnerAddress, txData, defaultBlock);
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
        assert.isETHAddressHex('spenderAddress', spenderAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        await assert.isSenderAddressAsync('ownerAddress', ownerAddress, this._web3Wrapper);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedSpenderAddress = spenderAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();
        assert.isValidBaseUnitAmount('amountInBaseUnits', amountInBaseUnits);

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);
        const txHash = await tokenContract.approve.sendTransactionAsync(normalizedSpenderAddress, amountInBaseUnits, {
            from: normalizedOwnerAddress,
            gas: txOpts.gasLimit,
            gasPrice: txOpts.gasPrice,
        });
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
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('spenderAddress', spenderAddress);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();
        const normalizedSpenderAddress = spenderAddress.toLowerCase();
        const txHash = await this.setAllowanceAsync(
            normalizedTokenAddress,
            normalizedOwnerAddress,
            normalizedSpenderAddress,
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
        methodOpts?: MethodOpts,
    ): Promise<BigNumber> {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('spenderAddress', spenderAddress);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();
        const normalizedSpenderAddress = spenderAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);
        const defaultBlock = _.isUndefined(methodOpts) ? undefined : methodOpts.defaultBlock;
        const txData = {};
        let allowanceInBaseUnits = await tokenContract.allowance.callAsync(
            normalizedOwnerAddress,
            normalizedSpenderAddress,
            txData,
            defaultBlock,
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
        methodOpts?: MethodOpts,
    ): Promise<BigNumber> {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();

        const proxyAddress = this._tokenTransferProxyWrapper.getContractAddress();
        const allowanceInBaseUnits = await this.getAllowanceAsync(
            normalizedTokenAddress,
            normalizedOwnerAddress,
            proxyAddress,
            methodOpts,
        );
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
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();
        assert.isValidBaseUnitAmount('amountInBaseUnits', amountInBaseUnits);

        const proxyAddress = this._tokenTransferProxyWrapper.getContractAddress();
        const txHash = await this.setAllowanceAsync(
            normalizedTokenAddress,
            normalizedOwnerAddress,
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
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();
        const txHash = await this.setProxyAllowanceAsync(
            normalizedTokenAddress,
            normalizedOwnerAddress,
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
        assert.isETHAddressHex('toAddress', toAddress);
        await assert.isSenderAddressAsync('fromAddress', fromAddress, this._web3Wrapper);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedFromAddress = fromAddress.toLowerCase();
        const normalizedToAddress = toAddress.toLowerCase();
        assert.isValidBaseUnitAmount('amountInBaseUnits', amountInBaseUnits);

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);

        const fromAddressBalance = await this.getBalanceAsync(normalizedTokenAddress, normalizedFromAddress);
        if (fromAddressBalance.lessThan(amountInBaseUnits)) {
            throw new Error(ContractWrappersError.InsufficientBalanceForTransfer);
        }

        const txHash = await tokenContract.transfer.sendTransactionAsync(normalizedToAddress, amountInBaseUnits, {
            from: normalizedFromAddress,
            gas: txOpts.gasLimit,
            gasPrice: txOpts.gasPrice,
        });
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
        assert.isETHAddressHex('toAddress', toAddress);
        assert.isETHAddressHex('fromAddress', fromAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper);
        const normalizedToAddress = toAddress.toLowerCase();
        const normalizedFromAddress = fromAddress.toLowerCase();
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedSenderAddress = senderAddress.toLowerCase();
        assert.isValidBaseUnitAmount('amountInBaseUnits', amountInBaseUnits);

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
            {
                from: normalizedSenderAddress,
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
            },
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
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends TokenContractEventArgs>(
        tokenAddress: string,
        eventName: TokenEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
    ): string {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        assert.doesBelongToStringEnum('eventName', eventName, TokenEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscribe<ArgsType>(
            normalizedTokenAddress,
            eventName,
            indexFilterValues,
            artifacts.Token.abi,
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
     * @param   tokenAddress        An address of the token that emitted the logs.
     * @param   eventName           The token contract event you would like to subscribe to.
     * @param   blockRange          Block range to get logs from.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends TokenContractEventArgs>(
        tokenAddress: string,
        eventName: TokenEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        assert.doesBelongToStringEnum('eventName', eventName, TokenEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._getLogsAsync<ArgsType>(
            normalizedTokenAddress,
            eventName,
            blockRange,
            indexFilterValues,
            artifacts.Token.abi,
        );
        return logs;
    }
    private _invalidateContractInstances(): void {
        this.unsubscribeAll();
        this._tokenContractsByAddress = {};
    }
    private async _getTokenContractAsync(tokenAddress: string): Promise<TokenContract> {
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        let tokenContract = this._tokenContractsByAddress[normalizedTokenAddress];
        if (!_.isUndefined(tokenContract)) {
            return tokenContract;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.Token,
            normalizedTokenAddress,
        );
        const contractInstance = new TokenContract(
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
