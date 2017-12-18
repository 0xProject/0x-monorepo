import {
    BlockParam,
    DecodedLogEvent,
    ExchangeContractEventArgs,
    ExchangeEvents,
    IndexedFilterValues,
    LogCancelContractEventArgs,
    LogFillContractEventArgs,
    LogWithDecodedArgs,
    Order,
    SignedOrder,
    SubscriptionOpts,
    Token as ZeroExToken,
    TransactionReceiptWithDecodedLogs,
    ZeroEx,
} from '0x.js';
import {
    InjectedWeb3Subprovider,
    ledgerEthereumBrowserClientFactoryAsync,
    LedgerSubprovider,
    LedgerWalletSubprovider,
    RedundantRPCSubprovider,
} from '@0xproject/subproviders';
import {intervalUtils, promisify} from '@0xproject/utils';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import * as React from 'react';
import contract = require('truffle-contract');
import {TokenSendCompleted} from 'ts/components/flash_messages/token_send_completed';
import {TransactionSubmitted} from 'ts/components/flash_messages/transaction_submitted';
import {trackedTokenStorage} from 'ts/local_storage/tracked_token_storage';
import {tradeHistoryStorage} from 'ts/local_storage/trade_history_storage';
import {Dispatcher} from 'ts/redux/dispatcher';
import {
    BlockchainCallErrs,
    BlockchainErrs,
    ContractInstance,
    EtherscanLinkSuffixes,
    ProviderType,
    Side,
    SignatureData,
    Token,
    TokenByAddress,
    TokenStateByAddress,
} from 'ts/types';
import {configs} from 'ts/utils/configs';
import {constants} from 'ts/utils/constants';
import {errorReporter} from 'ts/utils/error_reporter';
import {utils} from 'ts/utils/utils';
import {Web3Wrapper} from 'ts/web3_wrapper';
import Web3 = require('web3');
import ProviderEngine = require('web3-provider-engine');
import FilterSubprovider = require('web3-provider-engine/subproviders/filters');

import * as MintableArtifacts from '../contracts/Mintable.json';

const BLOCK_NUMBER_BACK_TRACK = 50;

export class Blockchain {
    public networkId: number;
    public nodeVersion: string;
    private zeroEx: ZeroEx;
    private dispatcher: Dispatcher;
    private web3Wrapper?: Web3Wrapper;
    private exchangeAddress: string;
    private userAddress: string;
    private cachedProvider: Web3.Provider;
    private ledgerSubprovider: LedgerWalletSubprovider;
    private zrxPollIntervalId: NodeJS.Timer;
    private static async onPageLoadAsync() {
        if (document.readyState === 'complete') {
            return; // Already loaded
        }
        return new Promise((resolve, reject) => {
            window.onload = resolve;
        });
    }
    private static getNameGivenProvider(provider: Web3.Provider): string {
        if (!_.isUndefined((provider as any).isMetaMask)) {
            return constants.METAMASK_PROVIDER_NAME;
        }

        // HACK: We use the fact that Parity Signer's provider is an instance of their
        // internal `Web3FrameProvider` class.
        const isParitySigner = _.startsWith(provider.constructor.toString(), 'function Web3FrameProvider');
        if (isParitySigner) {
            return constants.PARITY_SIGNER_PROVIDER_NAME;
        }

        return constants.GENERIC_PROVIDER_NAME;
    }
    private static async getProviderAsync(injectedWeb3: Web3, networkIdIfExists: number) {
        const doesInjectedWeb3Exist = !_.isUndefined(injectedWeb3);
        const publicNodeUrlsIfExistsForNetworkId = constants.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists];
        const isPublicNodeAvailableForNetworkId = !_.isUndefined(publicNodeUrlsIfExistsForNetworkId);

        let provider;
        if (doesInjectedWeb3Exist && isPublicNodeAvailableForNetworkId) {
            // We catch all requests involving a users account and send it to the injectedWeb3
            // instance. All other requests go to the public hosted node.
            provider = new ProviderEngine();
            provider.addProvider(new InjectedWeb3Subprovider(injectedWeb3));
            provider.addProvider(new FilterSubprovider());
            provider.addProvider(new RedundantRPCSubprovider(
                publicNodeUrlsIfExistsForNetworkId,
            ));
            provider.start();
        } else if (doesInjectedWeb3Exist) {
            // Since no public node for this network, all requests go to injectedWeb3 instance
            provider = injectedWeb3.currentProvider;
        } else {
            // If no injectedWeb3 instance, all requests fallback to our public hosted mainnet/testnet node
            // We do this so that users can still browse the 0x Portal DApp even if they do not have web3
            // injected into their browser.
            provider = new ProviderEngine();
            provider.addProvider(new FilterSubprovider());
            const networkId = configs.isMainnetEnabled ?
                constants.MAINNET_NETWORK_ID :
                constants.TESTNET_NETWORK_ID;
            provider.addProvider(new RedundantRPCSubprovider(
                constants.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkId],
            ));
            provider.start();
        }

        return provider;
    }
    constructor(dispatcher: Dispatcher, isSalePage: boolean = false) {
        this.dispatcher = dispatcher;
        this.userAddress = '';
        // tslint:disable-next-line:no-floating-promises
        this.onPageLoadInitFireAndForgetAsync();
    }
    public async networkIdUpdatedFireAndForgetAsync(newNetworkId: number) {
        const isConnected = !_.isUndefined(newNetworkId);
        if (!isConnected) {
            this.networkId = newNetworkId;
            this.dispatcher.encounteredBlockchainError(BlockchainErrs.DISCONNECTED_FROM_ETHEREUM_NODE);
            this.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
        } else if (this.networkId !== newNetworkId) {
            this.networkId = newNetworkId;
            this.dispatcher.encounteredBlockchainError('');
            await this.fetchTokenInformationAsync();
            await this.rehydrateStoreWithContractEvents();
        }
    }
    public async userAddressUpdatedFireAndForgetAsync(newUserAddress: string) {
        if (this.userAddress !== newUserAddress) {
            this.userAddress = newUserAddress;
            await this.fetchTokenInformationAsync();
            await this.rehydrateStoreWithContractEvents();
        }
    }
    public async nodeVersionUpdatedFireAndForgetAsync(nodeVersion: string) {
        if (this.nodeVersion !== nodeVersion) {
            this.nodeVersion = nodeVersion;
        }
    }
    public async isAddressInTokenRegistryAsync(tokenAddress: string): Promise<boolean> {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        // HACK: temporarily whitelist the new WETH token address `as if` they were
        // already in the tokenRegistry.
        if (configs.shouldDeprecateOldWethToken &&
            tokenAddress === configs.newWrappedEthers[this.networkId]) {
            return true;
        }
        const tokenIfExists = await this.zeroEx.tokenRegistry.getTokenIfExistsAsync(tokenAddress);
        return !_.isUndefined(tokenIfExists);
    }
    public getLedgerDerivationPathIfExists(): string {
        if (_.isUndefined(this.ledgerSubprovider)) {
            return undefined;
        }
        const path = this.ledgerSubprovider.getPath();
        return path;
    }
    public updateLedgerDerivationPathIfExists(path: string) {
        if (_.isUndefined(this.ledgerSubprovider)) {
            return; // noop
        }
        this.ledgerSubprovider.setPath(path);
    }
    public updateLedgerDerivationIndex(pathIndex: number) {
        if (_.isUndefined(this.ledgerSubprovider)) {
            return; // noop
        }
        this.ledgerSubprovider.setPathIndex(pathIndex);
    }
    public async providerTypeUpdatedFireAndForgetAsync(providerType: ProviderType) {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        // Should actually be Web3.Provider|ProviderEngine union type but it causes issues
        // later on in the logic.
        let provider;
        switch (providerType) {
            case ProviderType.LEDGER: {
                const isU2FSupported = await utils.isU2FSupportedAsync();
                if (!isU2FSupported) {
                    throw new Error('Cannot update providerType to LEDGER without U2F support');
                }

                // Cache injected provider so that we can switch the user back to it easily
                this.cachedProvider = this.web3Wrapper.getProviderObj();

                this.dispatcher.updateUserAddress(''); // Clear old userAddress

                provider = new ProviderEngine();
                const ledgerWalletConfigs = {
                    networkId: this.networkId,
                    ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
                };
                this.ledgerSubprovider = new LedgerSubprovider(ledgerWalletConfigs);
                provider.addProvider(this.ledgerSubprovider);
                provider.addProvider(new FilterSubprovider());
                const networkId = configs.isMainnetEnabled ?
                    constants.MAINNET_NETWORK_ID :
                    constants.TESTNET_NETWORK_ID;
                provider.addProvider(new RedundantRPCSubprovider(
                    constants.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkId],
                ));
                provider.start();
                this.web3Wrapper.destroy();
                const shouldPollUserAddress = false;
                this.web3Wrapper = new Web3Wrapper(this.dispatcher, provider, this.networkId, shouldPollUserAddress);
                this.zeroEx.setProvider(provider, networkId);
                await this.postInstantiationOrUpdatingProviderZeroExAsync();
                break;
            }

            case ProviderType.INJECTED: {
                if (_.isUndefined(this.cachedProvider)) {
                    return; // Going from injected to injected, so we noop
                }
                provider = this.cachedProvider;
                const shouldPollUserAddress = true;
                this.web3Wrapper = new Web3Wrapper(this.dispatcher, provider, this.networkId, shouldPollUserAddress);
                this.zeroEx.setProvider(provider, this.networkId);
                await this.postInstantiationOrUpdatingProviderZeroExAsync();
                delete this.ledgerSubprovider;
                delete this.cachedProvider;
                break;
            }

            default:
                throw utils.spawnSwitchErr('providerType', providerType);
        }

        await this.fetchTokenInformationAsync();
    }
    public async setProxyAllowanceAsync(token: Token, amountInBaseUnits: BigNumber): Promise<void> {
        utils.assert(this.isValidAddress(token.address), BlockchainCallErrs.TOKEN_ADDRESS_IS_INVALID);
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');

        const txHash = await this.zeroEx.token.setProxyAllowanceAsync(
            token.address, this.userAddress, amountInBaseUnits,
        );
        await this.showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const allowance = amountInBaseUnits;
        this.dispatcher.replaceTokenAllowanceByAddress(token.address, allowance);
    }
    public async transferAsync(token: Token, toAddress: string,
                               amountInBaseUnits: BigNumber): Promise<void> {
        const txHash = await this.zeroEx.token.transferAsync(
            token.address, this.userAddress, toAddress, amountInBaseUnits,
        );
        await this.showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const etherScanLinkIfExists = utils.getEtherScanLinkIfExists(txHash, this.networkId, EtherscanLinkSuffixes.tx);
        this.dispatcher.showFlashMessage(React.createElement(TokenSendCompleted, {
            etherScanLinkIfExists,
            token,
            toAddress,
            amountInBaseUnits,
        }));
    }
    public portalOrderToSignedOrder(maker: string, taker: string, makerTokenAddress: string,
                                    takerTokenAddress: string, makerTokenAmount: BigNumber,
                                    takerTokenAmount: BigNumber, makerFee: BigNumber,
                                    takerFee: BigNumber, expirationUnixTimestampSec: BigNumber,
                                    feeRecipient: string,
                                    signatureData: SignatureData, salt: BigNumber): SignedOrder {
        const ecSignature = signatureData;
        const exchangeContractAddress = this.getExchangeContractAddressIfExists();
        const takerOrNullAddress = _.isEmpty(taker) ? constants.NULL_ADDRESS : taker;
        const signedOrder = {
            ecSignature,
            exchangeContractAddress,
            expirationUnixTimestampSec,
            feeRecipient,
            maker,
            makerFee,
            makerTokenAddress,
            makerTokenAmount,
            salt,
            taker: takerOrNullAddress,
            takerFee,
            takerTokenAddress,
            takerTokenAmount,
        };
        return signedOrder;
    }
    public async fillOrderAsync(signedOrder: SignedOrder,
                                fillTakerTokenAmount: BigNumber): Promise<BigNumber> {
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const shouldThrowOnInsufficientBalanceOrAllowance = true;

        const txHash = await this.zeroEx.exchange.fillOrderAsync(
            signedOrder, fillTakerTokenAmount, shouldThrowOnInsufficientBalanceOrAllowance, this.userAddress,
        );
        const receipt = await this.showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const logs: Array<LogWithDecodedArgs<ExchangeContractEventArgs>> = receipt.logs as any;
        this.zeroEx.exchange.throwLogErrorsAsErrors(logs);
        const logFill = _.find(logs, {event: 'LogFill'});
        const args = logFill.args as any as LogFillContractEventArgs;
        const filledTakerTokenAmount = args.filledTakerTokenAmount;
        return filledTakerTokenAmount;
    }
    public async cancelOrderAsync(signedOrder: SignedOrder,
                                  cancelTakerTokenAmount: BigNumber): Promise<BigNumber> {
        const txHash = await this.zeroEx.exchange.cancelOrderAsync(
            signedOrder, cancelTakerTokenAmount,
        );
        const receipt = await this.showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const logs: Array<LogWithDecodedArgs<ExchangeContractEventArgs>> = receipt.logs as any;
        this.zeroEx.exchange.throwLogErrorsAsErrors(logs);
        const logCancel = _.find(logs, {event: ExchangeEvents.LogCancel});
        const args = logCancel.args as any as LogCancelContractEventArgs;
        const cancelledTakerTokenAmount = args.cancelledTakerTokenAmount;
        return cancelledTakerTokenAmount;
    }
    public async getUnavailableTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        utils.assert(ZeroEx.isValidOrderHash(orderHash), 'Must be valid orderHash');
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        const unavailableTakerAmount = await this.zeroEx.exchange.getUnavailableTakerAmountAsync(orderHash);
        return unavailableTakerAmount;
    }
    public getExchangeContractAddressIfExists() {
        return this.exchangeAddress;
    }
    public async validateFillOrderThrowIfInvalidAsync(signedOrder: SignedOrder,
                                                      fillTakerTokenAmount: BigNumber,
                                                      takerAddress: string): Promise<void> {
        await this.zeroEx.exchange.validateFillOrderThrowIfInvalidAsync(
            signedOrder, fillTakerTokenAmount, takerAddress);
    }
    public async validateCancelOrderThrowIfInvalidAsync(order: Order,
                                                        cancelTakerTokenAmount: BigNumber): Promise<void> {
        await this.zeroEx.exchange.validateCancelOrderThrowIfInvalidAsync(order, cancelTakerTokenAmount);
    }
    public isValidAddress(address: string): boolean {
        const lowercaseAddress = address.toLowerCase();
        return this.web3Wrapper.isAddress(lowercaseAddress);
    }
    public async pollTokenBalanceAsync(token: Token) {
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const [currBalance] = await this.getTokenBalanceAndAllowanceAsync(this.userAddress, token.address);

        this.zrxPollIntervalId = intervalUtils.setAsyncExcludingInterval(async () => {
            const [balance] = await this.getTokenBalanceAndAllowanceAsync(this.userAddress, token.address);
            if (!balance.eq(currBalance)) {
                this.dispatcher.replaceTokenBalanceByAddress(token.address, balance);
                clearInterval(this.zrxPollIntervalId);
                delete this.zrxPollIntervalId;
            }
        }, 5000);
    }
    public async signOrderHashAsync(orderHash: string): Promise<SignatureData> {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        const makerAddress = this.userAddress;
        // If makerAddress is undefined, this means they have a web3 instance injected into their browser
        // but no account addresses associated with it.
        if (_.isUndefined(makerAddress)) {
            throw new Error('Tried to send a sign request but user has no associated addresses');
        }
        const ecSignature = await this.zeroEx.signOrderHashAsync(orderHash, makerAddress);
        const signatureData = _.extend({}, ecSignature, {
            hash: orderHash,
        });
        this.dispatcher.updateSignatureData(signatureData);
        return signatureData;
    }
    public async mintTestTokensAsync(token: Token) {
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const mintableContract = await this.instantiateContractIfExistsAsync(MintableArtifacts, token.address);
        await mintableContract.mint(constants.MINT_AMOUNT, {
            from: this.userAddress,
        });
        const balanceDelta = constants.MINT_AMOUNT;
        this.dispatcher.updateTokenBalanceByAddress(token.address, balanceDelta);
    }
    public async getBalanceInEthAsync(owner: string): Promise<BigNumber> {
        const balance = await this.web3Wrapper.getBalanceInEthAsync(owner);
        return balance;
    }
    public async convertEthToWrappedEthTokensAsync(etherTokenAddress: string, amount: BigNumber): Promise<void> {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const txHash = await this.zeroEx.etherToken.depositAsync(etherTokenAddress, amount, this.userAddress);
        await this.showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
    }
    public async convertWrappedEthTokensToEthAsync(etherTokenAddress: string, amount: BigNumber): Promise<void> {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const txHash = await this.zeroEx.etherToken.withdrawAsync(etherTokenAddress, amount, this.userAddress);
        await this.showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
    }
    public async doesContractExistAtAddressAsync(address: string) {
        const doesContractExist = await this.web3Wrapper.doesContractExistAtAddressAsync(address);
        return doesContractExist;
    }
    public async getCurrentUserTokenBalanceAndAllowanceAsync(tokenAddress: string): Promise<BigNumber[]> {
      const tokenBalanceAndAllowance = await this.getTokenBalanceAndAllowanceAsync(this.userAddress, tokenAddress);
      return tokenBalanceAndAllowance;
    }
    public async getTokenBalanceAndAllowanceAsync(ownerAddress: string, tokenAddress: string):
                    Promise<BigNumber[]> {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');

        if (_.isEmpty(ownerAddress)) {
            const zero = new BigNumber(0);
            return [zero, zero];
        }
        let balance = new BigNumber(0);
        let allowance = new BigNumber(0);
        if (this.doesUserAddressExist()) {
            balance = await this.zeroEx.token.getBalanceAsync(tokenAddress, ownerAddress);
            allowance = await this.zeroEx.token.getProxyAllowanceAsync(tokenAddress, ownerAddress);
        }
        return [balance, allowance];
    }
    public async updateTokenBalancesAndAllowancesAsync(tokens: Token[]) {
        const tokenStateByAddress: TokenStateByAddress = {};
        for (const token of tokens) {
            let balance = new BigNumber(0);
            let allowance = new BigNumber(0);
            if (this.doesUserAddressExist()) {
                [
                    balance,
                    allowance,
                ] = await this.getTokenBalanceAndAllowanceAsync(this.userAddress, token.address);
            }
            const tokenState = {
                balance,
                allowance,
            };
            tokenStateByAddress[token.address] = tokenState;
        }
        this.dispatcher.updateTokenStateByAddress(tokenStateByAddress);
    }
    public async getUserAccountsAsync() {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        const userAccountsIfExists = await this.zeroEx.getAvailableAddressesAsync();
        return userAccountsIfExists;
    }
    // HACK: When a user is using a Ledger, we simply dispatch the selected userAddress, which
    // by-passes the web3Wrapper logic for updating the prevUserAddress. We therefore need to
    // manually update it. This should only be called by the LedgerConfigDialog.
    public updateWeb3WrapperPrevUserAddress(newUserAddress: string) {
        this.web3Wrapper.updatePrevUserAddress(newUserAddress);
    }
    public destroy() {
        clearInterval(this.zrxPollIntervalId);
        this.web3Wrapper.destroy();
        this.stopWatchingExchangeLogFillEvents();
    }
    private async showEtherScanLinkAndAwaitTransactionMinedAsync(
        txHash: string): Promise<TransactionReceiptWithDecodedLogs> {
        const etherScanLinkIfExists = utils.getEtherScanLinkIfExists(txHash, this.networkId, EtherscanLinkSuffixes.tx);
        this.dispatcher.showFlashMessage(React.createElement(TransactionSubmitted, {
            etherScanLinkIfExists,
        }));
        const receipt = await this.zeroEx.awaitTransactionMinedAsync(txHash);
        return receipt;
    }
    private doesUserAddressExist(): boolean {
        return this.userAddress !== '';
    }
    private async rehydrateStoreWithContractEvents() {
        // Ensure we are only ever listening to one set of events
        this.stopWatchingExchangeLogFillEvents();

        if (!this.doesUserAddressExist()) {
            return; // short-circuit
        }

        if (!_.isUndefined(this.zeroEx)) {
            // Since we do not have an index on the `taker` address and want to show
            // transactions where an account is either the `maker` or `taker`, we loop
            // through all fill events, and filter/cache them client-side.
            const filterIndexObj = {};
            await this.startListeningForExchangeLogFillEventsAsync(filterIndexObj);
        }
    }
    private async startListeningForExchangeLogFillEventsAsync(indexFilterValues: IndexedFilterValues): Promise<void> {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this.doesUserAddressExist(), BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        // Fetch historical logs
        await this.fetchHistoricalExchangeLogFillEventsAsync(indexFilterValues);

        // Start a subscription for new logs
        this.zeroEx.exchange.subscribe(
            ExchangeEvents.LogFill, indexFilterValues,
            async (err: Error, decodedLogEvent: DecodedLogEvent<LogFillContractEventArgs>) => {
            if (err) {
                // Note: it's not entirely clear from the documentation which
                // errors will be thrown by `watch`. For now, let's log the error
                // to rollbar and stop watching when one occurs
                // tslint:disable-next-line:no-floating-promises
                errorReporter.reportAsync(err); // fire and forget
                return;
            } else {
                const decodedLog = decodedLogEvent.log;
                if (!this.doesLogEventInvolveUser(decodedLog)) {
                    return; // We aren't interested in the fill event
                }
                this.updateLatestFillsBlockIfNeeded(decodedLog.blockNumber);
                const fill = await this.convertDecodedLogToFillAsync(decodedLog);
                if (decodedLogEvent.isRemoved) {
                    tradeHistoryStorage.removeFillFromUser(this.userAddress, this.networkId, fill);
                } else {
                    tradeHistoryStorage.addFillToUser(this.userAddress, this.networkId, fill);
                }
            }
        });
    }
    private async fetchHistoricalExchangeLogFillEventsAsync(indexFilterValues: IndexedFilterValues) {
        const fromBlock = tradeHistoryStorage.getFillsLatestBlock(this.userAddress, this.networkId);
        const subscriptionOpts: SubscriptionOpts = {
            fromBlock,
            toBlock: 'latest' as BlockParam,
        };
        const decodedLogs = await this.zeroEx.exchange.getLogsAsync<LogFillContractEventArgs>(
            ExchangeEvents.LogFill, subscriptionOpts, indexFilterValues,
        );
        for (const decodedLog of decodedLogs) {
            if (!this.doesLogEventInvolveUser(decodedLog)) {
                continue; // We aren't interested in the fill event
            }
            this.updateLatestFillsBlockIfNeeded(decodedLog.blockNumber);
            const fill = await this.convertDecodedLogToFillAsync(decodedLog);
            tradeHistoryStorage.addFillToUser(this.userAddress, this.networkId, fill);
        }
    }
    private async convertDecodedLogToFillAsync(decodedLog: LogWithDecodedArgs<LogFillContractEventArgs>) {
        const args = decodedLog.args;
        const blockTimestamp = await this.web3Wrapper.getBlockTimestampAsync(decodedLog.blockHash);
        const fill = {
            filledTakerTokenAmount: args.filledTakerTokenAmount,
            filledMakerTokenAmount: args.filledMakerTokenAmount,
            logIndex: decodedLog.logIndex,
            maker: args.maker,
            orderHash: args.orderHash,
            taker: args.taker,
            makerToken: args.makerToken,
            takerToken: args.takerToken,
            paidMakerFee: args.paidMakerFee,
            paidTakerFee: args.paidTakerFee,
            transactionHash: decodedLog.transactionHash,
            blockTimestamp,
        };
        return fill;
    }
    private doesLogEventInvolveUser(decodedLog: LogWithDecodedArgs<LogFillContractEventArgs>) {
        const args = decodedLog.args;
        const isUserMakerOrTaker = args.maker === this.userAddress ||
                                   args.taker === this.userAddress;
        return isUserMakerOrTaker;
    }
    private updateLatestFillsBlockIfNeeded(blockNumber: number) {
        const isBlockPending = _.isNull(blockNumber);
        if (!isBlockPending) {
            // Hack: I've observed the behavior where a client won't register certain fill events
            // and lowering the cache blockNumber fixes the issue. As a quick fix for now, simply
            // set the cached blockNumber 50 below the one returned. This way, upon refreshing, a user
            // would still attempt to re-fetch events from the previous 50 blocks, but won't need to
            // re-fetch all events in all blocks.
            // TODO: Debug if this is a race condition, and apply a more precise fix
            const blockNumberToSet = blockNumber - BLOCK_NUMBER_BACK_TRACK < 0 ?
                                     0 :
                                     blockNumber - BLOCK_NUMBER_BACK_TRACK;
            tradeHistoryStorage.setFillsLatestBlock(this.userAddress, this.networkId, blockNumberToSet);
        }
    }
    private stopWatchingExchangeLogFillEvents(): void {
        this.zeroEx.exchange.unsubscribeAll();
    }
    private async getTokenRegistryTokensByAddressAsync(): Promise<TokenByAddress> {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        const tokenRegistryTokens = await this.zeroEx.tokenRegistry.getTokensAsync();

        const tokenByAddress: TokenByAddress = {};
        _.each(tokenRegistryTokens, (t: ZeroExToken, i: number) => {
            // HACK: For now we have a hard-coded list of iconUrls for the dummyTokens
            // TODO: Refactor this out and pull the iconUrl directly from the TokenRegistry
            const iconUrl = constants.iconUrlBySymbol[t.symbol];
            // HACK: Temporarily we hijack the WETH addresses fetched from the tokenRegistry
            // so that we can take our time with actually updating it. This ensures that when
            // we deploy the new WETH page, everyone will re-fill their trackedTokens with the
            // new canonical WETH.
            // TODO: Remove this hack once we've updated the TokenRegistries
            let address = t.address;
            if (configs.shouldDeprecateOldWethToken && t.symbol === 'WETH') {
                    const newEtherTokenAddressIfExists = configs.newWrappedEthers[this.networkId];
                    if (!_.isUndefined(newEtherTokenAddressIfExists)) {
                        address = newEtherTokenAddressIfExists;
                    }
            }
            const token: Token = {
                iconUrl,
                address,
                name: t.name,
                symbol: t.symbol,
                decimals: t.decimals,
                isTracked: false,
                isRegistered: true,
            };
            tokenByAddress[token.address] = token;
        });
        return tokenByAddress;
    }
    private async onPageLoadInitFireAndForgetAsync() {
        await Blockchain.onPageLoadAsync(); // wait for page to load

        // Hack: We need to know the networkId the injectedWeb3 is connected to (if it is defined) in
        // order to properly instantiate the web3Wrapper. Since we must use the async call, we cannot
        // retrieve it from within the web3Wrapper constructor. This is and should remain the only
        // call to a web3 instance outside of web3Wrapper in the entire dapp.
        // In addition, if the user has an injectedWeb3 instance that is disconnected from a backing
        // Ethereum node, this call will throw. We need to handle this case gracefully
        const injectedWeb3 = (window as any).web3;
        let networkIdIfExists: number;
        if (!_.isUndefined(injectedWeb3)) {
            try {
                networkIdIfExists = _.parseInt(await promisify<string>(injectedWeb3.version.getNetwork)());
            } catch (err) {
                // Ignore error and proceed with networkId undefined
            }
        }

        const provider = await Blockchain.getProviderAsync(injectedWeb3, networkIdIfExists);
        const networkId = !_.isUndefined(networkIdIfExists) ? networkIdIfExists :
                            configs.isMainnetEnabled ?
                                constants.MAINNET_NETWORK_ID :
                                constants.TESTNET_NETWORK_ID;
        const zeroExConfigs = {
            networkId,
        };
        this.zeroEx = new ZeroEx(provider, zeroExConfigs);
        this.updateProviderName(injectedWeb3);
        const shouldPollUserAddress = true;
        this.web3Wrapper = new Web3Wrapper(this.dispatcher, provider, networkId, shouldPollUserAddress);
        await this.postInstantiationOrUpdatingProviderZeroExAsync();
    }
    // This method should always be run after instantiating or updating the provider
    // of the ZeroEx instance.
    private async postInstantiationOrUpdatingProviderZeroExAsync() {
        utils.assert(!_.isUndefined(this.zeroEx), 'ZeroEx must be instantiated.');
        this.exchangeAddress = this.zeroEx.exchange.getContractAddress();
    }
    private updateProviderName(injectedWeb3: Web3) {
        const doesInjectedWeb3Exist = !_.isUndefined(injectedWeb3);
        const providerName = doesInjectedWeb3Exist ?
                             Blockchain.getNameGivenProvider(injectedWeb3.currentProvider) :
                             constants.PUBLIC_PROVIDER_NAME;
        this.dispatcher.updateInjectedProviderName(providerName);
    }
    private async fetchTokenInformationAsync() {
        utils.assert(!_.isUndefined(this.networkId),
                     'Cannot call fetchTokenInformationAsync if disconnected from Ethereum node');

        this.dispatcher.updateBlockchainIsLoaded(false);
        this.dispatcher.clearTokenByAddress();

        const tokenRegistryTokensByAddress = await this.getTokenRegistryTokensByAddressAsync();

        // HACK: We need to fetch the userAddress here because otherwise we cannot save the
        // tracked tokens in localStorage under the users address nor fetch the token
        // balances and allowances and we need to do this in order not to trigger the blockchain
        // loading dialog to show up twice. First to load the contracts, and second to load the
        // balances and allowances.
        this.userAddress = await this.web3Wrapper.getFirstAccountIfExistsAsync();
        if (!_.isEmpty(this.userAddress)) {
            this.dispatcher.updateUserAddress(this.userAddress);
        }

        let trackedTokensIfExists = trackedTokenStorage.getTrackedTokensIfExists(this.userAddress, this.networkId);
        const tokenRegistryTokens = _.values(tokenRegistryTokensByAddress);
        if (_.isUndefined(trackedTokensIfExists)) {
            trackedTokensIfExists = _.map(configs.defaultTrackedTokenSymbols, symbol => {
                const token = _.find(tokenRegistryTokens, t => t.symbol === symbol);
                token.isTracked = true;
                return token;
            });
            _.each(trackedTokensIfExists, token => {
                trackedTokenStorage.addTrackedTokenToUser(this.userAddress, this.networkId, token);
            });
        } else {
            // Properly set all tokenRegistry tokens `isTracked` to true if they are in the existing trackedTokens array
            _.each(trackedTokensIfExists, trackedToken => {
                if (!_.isUndefined(tokenRegistryTokensByAddress[trackedToken.address])) {
                    tokenRegistryTokensByAddress[trackedToken.address].isTracked = true;
                }
            });
        }
        const allTokens = _.uniq([...tokenRegistryTokens, ...trackedTokensIfExists]);
        this.dispatcher.updateTokenByAddress(allTokens);

        // Get balance/allowance for tracked tokens
        await this.updateTokenBalancesAndAllowancesAsync(trackedTokensIfExists);

        const mostPopularTradingPairTokens: Token[] = [
            _.find(allTokens, {symbol: configs.defaultTrackedTokenSymbols[0]}),
            _.find(allTokens, {symbol: configs.defaultTrackedTokenSymbols[1]}),
        ];
        this.dispatcher.updateChosenAssetTokenAddress(Side.deposit, mostPopularTradingPairTokens[0].address);
        this.dispatcher.updateChosenAssetTokenAddress(Side.receive, mostPopularTradingPairTokens[1].address);
        this.dispatcher.updateBlockchainIsLoaded(true);
    }
    private async instantiateContractIfExistsAsync(artifact: any, address?: string): Promise<ContractInstance> {
        const c = await contract(artifact);
        const providerObj = this.web3Wrapper.getProviderObj();
        c.setProvider(providerObj);

        const artifactNetworkConfigs = artifact.networks[this.networkId];
        let contractAddress;
        if (!_.isUndefined(address)) {
            contractAddress = address;
        } else if (!_.isUndefined(artifactNetworkConfigs)) {
            contractAddress = artifactNetworkConfigs.address;
        }

        if (!_.isUndefined(contractAddress)) {
            const doesContractExist = await this.doesContractExistAtAddressAsync(contractAddress);
            if (!doesContractExist) {
                utils.consoleLog(`Contract does not exist: ${artifact.contract_name} at ${contractAddress}`);
                throw new Error(BlockchainCallErrs.CONTRACT_DOES_NOT_EXIST);
            }
        }

        try {
            const contractInstance = _.isUndefined(address) ?
                                     await c.deployed() :
                                     await c.at(address);
            return contractInstance;
        } catch (err) {
            const errMsg = `${err}`;
            utils.consoleLog(`Notice: Error encountered: ${err} ${err.stack}`);
            if (_.includes(errMsg, 'not been deployed to detected network')) {
                throw new Error(BlockchainCallErrs.CONTRACT_DOES_NOT_EXIST);
            } else {
                await errorReporter.reportAsync(err);
                throw new Error(BlockchainCallErrs.UNHANDLED_ERROR);
            }
        }
    }
} // tslint:disable:max-file-line-count
