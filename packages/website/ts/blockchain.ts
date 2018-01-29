import {
    BlockParam,
    BlockRange,
    DecodedLogEvent,
    ExchangeContractEventArgs,
    ExchangeEvents,
    IndexedFilterValues,
    LogCancelContractEventArgs,
    LogFillContractEventArgs,
    LogWithDecodedArgs,
    Order,
    SignedOrder,
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
import { BigNumber, intervalUtils, promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';
import contract = require('truffle-contract');
import { TokenSendCompleted } from 'ts/components/flash_messages/token_send_completed';
import { TransactionSubmitted } from 'ts/components/flash_messages/transaction_submitted';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { tradeHistoryStorage } from 'ts/local_storage/trade_history_storage';
import { Dispatcher } from 'ts/redux/dispatcher';
import {
    BlockchainCallErrs,
    BlockchainErrs,
    ContractInstance,
    EtherscanLinkSuffixes,
    ProviderType,
    Side,
    SideToAssetToken,
    SignatureData,
    Token,
    TokenByAddress,
    TokenStateByAddress,
} from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';
import { Web3Wrapper } from 'ts/web3_wrapper';
import Web3 = require('web3');
import ProviderEngine = require('web3-provider-engine');
import FilterSubprovider = require('web3-provider-engine/subproviders/filters');

import * as MintableArtifacts from '../contracts/Mintable.json';

const BLOCK_NUMBER_BACK_TRACK = 50;

export class Blockchain {
    public networkId: number;
    public nodeVersion: string;
    private _zeroEx: ZeroEx;
    private _dispatcher: Dispatcher;
    private _web3Wrapper?: Web3Wrapper;
    private _exchangeAddress: string;
    private _userAddress: string;
    private _cachedProvider: Web3.Provider;
    private _cachedProviderNetworkId: number;
    private _ledgerSubprovider: LedgerWalletSubprovider;
    private static async _onPageLoadAsync(): Promise<void> {
        if (document.readyState === 'complete') {
            return; // Already loaded
        }
        return new Promise<void>((resolve, reject) => {
            window.onload = () => resolve();
        });
    }
    private static _getNameGivenProvider(provider: Web3.Provider): string {
        if (!_.isUndefined((provider as any).isMetaMask)) {
            return constants.PROVIDER_NAME_METAMASK;
        }

        // HACK: We use the fact that Parity Signer's provider is an instance of their
        // internal `Web3FrameProvider` class.
        const isParitySigner = _.startsWith(provider.constructor.toString(), 'function Web3FrameProvider');
        if (isParitySigner) {
            return constants.PROVIDER_NAME_PARITY_SIGNER;
        }

        return constants.PROVIDER_NAME_GENERIC;
    }
    private static async _getProviderAsync(injectedWeb3: Web3, networkIdIfExists: number) {
        const doesInjectedWeb3Exist = !_.isUndefined(injectedWeb3);
        const publicNodeUrlsIfExistsForNetworkId = configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists];
        const isPublicNodeAvailableForNetworkId = !_.isUndefined(publicNodeUrlsIfExistsForNetworkId);

        let provider;
        if (doesInjectedWeb3Exist && isPublicNodeAvailableForNetworkId) {
            // We catch all requests involving a users account and send it to the injectedWeb3
            // instance. All other requests go to the public hosted node.
            provider = new ProviderEngine();
            provider.addProvider(new InjectedWeb3Subprovider(injectedWeb3));
            provider.addProvider(new FilterSubprovider());
            provider.addProvider(new RedundantRPCSubprovider(publicNodeUrlsIfExistsForNetworkId));
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
            const networkId = configs.IS_MAINNET_ENABLED ? constants.NETWORK_ID_MAINNET : constants.NETWORK_ID_TESTNET;
            provider.addProvider(new RedundantRPCSubprovider(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkId]));
            provider.start();
        }

        return provider;
    }
    constructor(dispatcher: Dispatcher, isSalePage: boolean = false) {
        this._dispatcher = dispatcher;
        this._userAddress = '';
        // tslint:disable-next-line:no-floating-promises
        this._onPageLoadInitFireAndForgetAsync();
    }
    public async networkIdUpdatedFireAndForgetAsync(newNetworkId: number) {
        const isConnected = !_.isUndefined(newNetworkId);
        if (!isConnected) {
            this.networkId = newNetworkId;
            this._dispatcher.encounteredBlockchainError(BlockchainErrs.DisconnectedFromEthereumNode);
            this._dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
        } else if (this.networkId !== newNetworkId) {
            this.networkId = newNetworkId;
            this._dispatcher.encounteredBlockchainError(BlockchainErrs.NoError);
            await this.fetchTokenInformationAsync();
            await this._rehydrateStoreWithContractEvents();
        }
    }
    public async userAddressUpdatedFireAndForgetAsync(newUserAddress: string) {
        if (this._userAddress !== newUserAddress) {
            this._userAddress = newUserAddress;
            await this.fetchTokenInformationAsync();
            await this._rehydrateStoreWithContractEvents();
        }
    }
    public async nodeVersionUpdatedFireAndForgetAsync(nodeVersion: string) {
        if (this.nodeVersion !== nodeVersion) {
            this.nodeVersion = nodeVersion;
        }
    }
    public async isAddressInTokenRegistryAsync(tokenAddress: string): Promise<boolean> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        // HACK: temporarily whitelist the new WETH token address `as if` they were
        // already in the tokenRegistry.
        // TODO: Remove this hack once we've updated the TokenRegistries
        // Airtable task: https://airtable.com/tblFe0Q9JuKJPYbTn/viwsOG2Y97qdIeCIO/recv3VGmIorFzHBVz
        if (configs.SHOULD_DEPRECATE_OLD_WETH_TOKEN && tokenAddress === configs.NEW_WRAPPED_ETHERS[this.networkId]) {
            return true;
        }
        const tokenIfExists = await this._zeroEx.tokenRegistry.getTokenIfExistsAsync(tokenAddress);
        return !_.isUndefined(tokenIfExists);
    }
    public getLedgerDerivationPathIfExists(): string {
        if (_.isUndefined(this._ledgerSubprovider)) {
            return undefined;
        }
        const path = this._ledgerSubprovider.getPath();
        return path;
    }
    public updateLedgerDerivationPathIfExists(path: string) {
        if (_.isUndefined(this._ledgerSubprovider)) {
            return; // noop
        }
        this._ledgerSubprovider.setPath(path);
    }
    public updateLedgerDerivationIndex(pathIndex: number) {
        if (_.isUndefined(this._ledgerSubprovider)) {
            return; // noop
        }
        this._ledgerSubprovider.setPathIndex(pathIndex);
    }
    public async updateProviderToLedgerAsync(networkId: number) {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');

        const isU2FSupported = await utils.isU2FSupportedAsync();
        if (!isU2FSupported) {
            throw new Error('Cannot update providerType to LEDGER without U2F support');
        }

        // Cache injected provider so that we can switch the user back to it easily
        if (_.isUndefined(this._cachedProvider)) {
            this._cachedProvider = this._web3Wrapper.getProviderObj();
            this._cachedProviderNetworkId = this.networkId;
        }

        this._userAddress = '';
        this._dispatcher.updateUserAddress(''); // Clear old userAddress

        const provider = new ProviderEngine();
        const ledgerWalletConfigs = {
            networkId,
            ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
        };
        this._ledgerSubprovider = new LedgerSubprovider(ledgerWalletConfigs);
        provider.addProvider(this._ledgerSubprovider);
        provider.addProvider(new FilterSubprovider());
        provider.addProvider(new RedundantRPCSubprovider(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkId]));
        provider.start();
        this._web3Wrapper.destroy();
        this.networkId = networkId;
        this._dispatcher.updateNetworkId(this.networkId);
        const shouldPollUserAddress = false;
        this._web3Wrapper = new Web3Wrapper(this._dispatcher, provider, this.networkId, shouldPollUserAddress);
        this._zeroEx.setProvider(provider, this.networkId);
        await this._postInstantiationOrUpdatingProviderZeroExAsync();
        this._web3Wrapper.startEmittingNetworkConnectionAndUserBalanceStateAsync();
        this._dispatcher.updateProviderType(ProviderType.Ledger);
    }
    public async updateProviderToInjectedAsync() {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');

        if (_.isUndefined(this._cachedProvider)) {
            return; // Going from injected to injected, so we noop
        }
        const provider = this._cachedProvider;
        this.networkId = this._cachedProviderNetworkId;

        this._web3Wrapper.destroy();
        const shouldPollUserAddress = true;
        this._web3Wrapper = new Web3Wrapper(this._dispatcher, provider, this.networkId, shouldPollUserAddress);

        this._userAddress = await this._web3Wrapper.getFirstAccountIfExistsAsync();

        this._zeroEx.setProvider(provider, this.networkId);
        await this._postInstantiationOrUpdatingProviderZeroExAsync();

        await this.fetchTokenInformationAsync();
        this._web3Wrapper.startEmittingNetworkConnectionAndUserBalanceStateAsync();
        this._dispatcher.updateProviderType(ProviderType.Injected);
        delete this._ledgerSubprovider;
        delete this._cachedProvider;
    }
    public async setProxyAllowanceAsync(token: Token, amountInBaseUnits: BigNumber): Promise<void> {
        utils.assert(this.isValidAddress(token.address), BlockchainCallErrs.TokenAddressIsInvalid);
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');

        this._showFlashMessageIfLedger();
        const txHash = await this._zeroEx.token.setProxyAllowanceAsync(
            token.address,
            this._userAddress,
            amountInBaseUnits,
        );
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const allowance = amountInBaseUnits;
    }
    public async transferAsync(token: Token, toAddress: string, amountInBaseUnits: BigNumber): Promise<void> {
        this._showFlashMessageIfLedger();
        const txHash = await this._zeroEx.token.transferAsync(
            token.address,
            this._userAddress,
            toAddress,
            amountInBaseUnits,
        );
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const etherScanLinkIfExists = utils.getEtherScanLinkIfExists(txHash, this.networkId, EtherscanLinkSuffixes.Tx);
        this._dispatcher.showFlashMessage(
            React.createElement(TokenSendCompleted, {
                etherScanLinkIfExists,
                token,
                toAddress,
                amountInBaseUnits,
            }),
        );
    }
    public portalOrderToSignedOrder(
        maker: string,
        taker: string,
        makerTokenAddress: string,
        takerTokenAddress: string,
        makerTokenAmount: BigNumber,
        takerTokenAmount: BigNumber,
        makerFee: BigNumber,
        takerFee: BigNumber,
        expirationUnixTimestampSec: BigNumber,
        feeRecipient: string,
        signatureData: SignatureData,
        salt: BigNumber,
    ): SignedOrder {
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
    public async fillOrderAsync(signedOrder: SignedOrder, fillTakerTokenAmount: BigNumber): Promise<BigNumber> {
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        const shouldThrowOnInsufficientBalanceOrAllowance = true;

        this._showFlashMessageIfLedger();
        const txHash = await this._zeroEx.exchange.fillOrderAsync(
            signedOrder,
            fillTakerTokenAmount,
            shouldThrowOnInsufficientBalanceOrAllowance,
            this._userAddress,
        );
        const receipt = await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const logs: Array<LogWithDecodedArgs<ExchangeContractEventArgs>> = receipt.logs as any;
        this._zeroEx.exchange.throwLogErrorsAsErrors(logs);
        const logFill = _.find(logs, { event: 'LogFill' });
        const args = (logFill.args as any) as LogFillContractEventArgs;
        const filledTakerTokenAmount = args.filledTakerTokenAmount;
        return filledTakerTokenAmount;
    }
    public async cancelOrderAsync(signedOrder: SignedOrder, cancelTakerTokenAmount: BigNumber): Promise<BigNumber> {
        this._showFlashMessageIfLedger();
        const txHash = await this._zeroEx.exchange.cancelOrderAsync(signedOrder, cancelTakerTokenAmount);
        const receipt = await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const logs: Array<LogWithDecodedArgs<ExchangeContractEventArgs>> = receipt.logs as any;
        this._zeroEx.exchange.throwLogErrorsAsErrors(logs);
        const logCancel = _.find(logs, { event: ExchangeEvents.LogCancel });
        const args = (logCancel.args as any) as LogCancelContractEventArgs;
        const cancelledTakerTokenAmount = args.cancelledTakerTokenAmount;
        return cancelledTakerTokenAmount;
    }
    public async getUnavailableTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        utils.assert(ZeroEx.isValidOrderHash(orderHash), 'Must be valid orderHash');
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        const unavailableTakerAmount = await this._zeroEx.exchange.getUnavailableTakerAmountAsync(orderHash);
        return unavailableTakerAmount;
    }
    public getExchangeContractAddressIfExists() {
        return this._exchangeAddress;
    }
    public async validateFillOrderThrowIfInvalidAsync(
        signedOrder: SignedOrder,
        fillTakerTokenAmount: BigNumber,
        takerAddress: string,
    ): Promise<void> {
        await this._zeroEx.exchange.validateFillOrderThrowIfInvalidAsync(
            signedOrder,
            fillTakerTokenAmount,
            takerAddress,
        );
    }
    public async validateCancelOrderThrowIfInvalidAsync(
        order: Order,
        cancelTakerTokenAmount: BigNumber,
    ): Promise<void> {
        await this._zeroEx.exchange.validateCancelOrderThrowIfInvalidAsync(order, cancelTakerTokenAmount);
    }
    public isValidAddress(address: string): boolean {
        const lowercaseAddress = address.toLowerCase();
        return this._web3Wrapper.isAddress(lowercaseAddress);
    }
    public async pollTokenBalanceAsync(token: Token) {
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        const [currBalance] = await this.getTokenBalanceAndAllowanceAsync(this._userAddress, token.address);

        const newTokenBalancePromise = new Promise((resolve: (balance: BigNumber) => void, reject) => {
            const tokenPollInterval = intervalUtils.setAsyncExcludingInterval(
                async () => {
                    const [balance] = await this.getTokenBalanceAndAllowanceAsync(this._userAddress, token.address);
                    if (!balance.eq(currBalance)) {
                        intervalUtils.clearAsyncExcludingInterval(tokenPollInterval);
                        resolve(balance);
                    }
                },
                5000,
                (err: Error) => {
                    utils.consoleLog(`Polling tokenBalance failed: ${err}`);
                    intervalUtils.clearAsyncExcludingInterval(tokenPollInterval);
                    reject(err);
                },
            );
        });

        return newTokenBalancePromise;
    }
    public async signOrderHashAsync(orderHash: string): Promise<SignatureData> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        const makerAddress = this._userAddress;
        // If makerAddress is undefined, this means they have a web3 instance injected into their browser
        // but no account addresses associated with it.
        if (_.isUndefined(makerAddress)) {
            throw new Error('Tried to send a sign request but user has no associated addresses');
        }
        this._showFlashMessageIfLedger();
        const ecSignature = await this._zeroEx.signOrderHashAsync(orderHash, makerAddress);
        const signatureData = _.extend({}, ecSignature, {
            hash: orderHash,
        });
        this._dispatcher.updateSignatureData(signatureData);
        return signatureData;
    }
    public async mintTestTokensAsync(token: Token) {
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        const mintableContract = await this._instantiateContractIfExistsAsync(MintableArtifacts, token.address);
        this._showFlashMessageIfLedger();
        await mintableContract.mint(constants.MINT_AMOUNT, {
            from: this._userAddress,
        });
        const balanceDelta = constants.MINT_AMOUNT;
    }
    public async getBalanceInEthAsync(owner: string): Promise<BigNumber> {
        const balance = await this._web3Wrapper.getBalanceInEthAsync(owner);
        return balance;
    }
    public async convertEthToWrappedEthTokensAsync(etherTokenAddress: string, amount: BigNumber): Promise<void> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        this._showFlashMessageIfLedger();
        const txHash = await this._zeroEx.etherToken.depositAsync(etherTokenAddress, amount, this._userAddress);
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
    }
    public async convertWrappedEthTokensToEthAsync(etherTokenAddress: string, amount: BigNumber): Promise<void> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        this._showFlashMessageIfLedger();
        const txHash = await this._zeroEx.etherToken.withdrawAsync(etherTokenAddress, amount, this._userAddress);
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
    }
    public async doesContractExistAtAddressAsync(address: string) {
        const doesContractExist = await this._web3Wrapper.doesContractExistAtAddressAsync(address);
        return doesContractExist;
    }
    public async getCurrentUserTokenBalanceAndAllowanceAsync(tokenAddress: string): Promise<BigNumber[]> {
        const tokenBalanceAndAllowance = await this.getTokenBalanceAndAllowanceAsync(this._userAddress, tokenAddress);
        return tokenBalanceAndAllowance;
    }
    public async getTokenBalanceAndAllowanceAsync(ownerAddress: string, tokenAddress: string): Promise<BigNumber[]> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');

        if (_.isEmpty(ownerAddress)) {
            const zero = new BigNumber(0);
            return [zero, zero];
        }
        let balance = new BigNumber(0);
        let allowance = new BigNumber(0);
        if (this._doesUserAddressExist()) {
            balance = await this._zeroEx.token.getBalanceAsync(tokenAddress, ownerAddress);
            allowance = await this._zeroEx.token.getProxyAllowanceAsync(tokenAddress, ownerAddress);
        }
        return [balance, allowance];
    }
    public async getUserAccountsAsync() {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        const userAccountsIfExists = await this._zeroEx.getAvailableAddressesAsync();
        return userAccountsIfExists;
    }
    // HACK: When a user is using a Ledger, we simply dispatch the selected userAddress, which
    // by-passes the web3Wrapper logic for updating the prevUserAddress. We therefore need to
    // manually update it. This should only be called by the LedgerConfigDialog.
    public updateWeb3WrapperPrevUserAddress(newUserAddress: string) {
        this._web3Wrapper.updatePrevUserAddress(newUserAddress);
    }
    public destroy() {
        this._web3Wrapper.destroy();
        this._stopWatchingExchangeLogFillEvents();
    }
    public async fetchTokenInformationAsync() {
        utils.assert(
            !_.isUndefined(this.networkId),
            'Cannot call fetchTokenInformationAsync if disconnected from Ethereum node',
        );

        this._dispatcher.updateBlockchainIsLoaded(false);
        this._dispatcher.clearTokenByAddress();

        const tokenRegistryTokensByAddress = await this._getTokenRegistryTokensByAddressAsync();

        let trackedTokensIfExists = trackedTokenStorage.getTrackedTokensIfExists(this._userAddress, this.networkId);
        const tokenRegistryTokens = _.values(tokenRegistryTokensByAddress);
        if (_.isUndefined(trackedTokensIfExists)) {
            trackedTokensIfExists = _.map(configs.DEFAULT_TRACKED_TOKEN_SYMBOLS, symbol => {
                const token = _.find(tokenRegistryTokens, t => t.symbol === symbol);
                token.isTracked = true;
                return token;
            });
            _.each(trackedTokensIfExists, token => {
                trackedTokenStorage.addTrackedTokenToUser(this._userAddress, this.networkId, token);
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
        const mostPopularTradingPairTokens: Token[] = [
            _.find(allTokens, { symbol: configs.DEFAULT_TRACKED_TOKEN_SYMBOLS[0] }),
            _.find(allTokens, { symbol: configs.DEFAULT_TRACKED_TOKEN_SYMBOLS[1] }),
        ];
        const sideToAssetToken: SideToAssetToken = {
            [Side.Deposit]: {
                address: mostPopularTradingPairTokens[0].address,
            },
            [Side.Receive]: {
                address: mostPopularTradingPairTokens[1].address,
            },
        };
        this._dispatcher.batchDispatch(allTokens, this.networkId, this._userAddress, sideToAssetToken);

        this._dispatcher.updateBlockchainIsLoaded(true);
    }
    private async _showEtherScanLinkAndAwaitTransactionMinedAsync(
        txHash: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const etherScanLinkIfExists = utils.getEtherScanLinkIfExists(txHash, this.networkId, EtherscanLinkSuffixes.Tx);
        this._dispatcher.showFlashMessage(
            React.createElement(TransactionSubmitted, {
                etherScanLinkIfExists,
            }),
        );
        const receipt = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        return receipt;
    }
    private _doesUserAddressExist(): boolean {
        return this._userAddress !== '';
    }
    private async _rehydrateStoreWithContractEvents() {
        // Ensure we are only ever listening to one set of events
        this._stopWatchingExchangeLogFillEvents();

        if (!this._doesUserAddressExist()) {
            return; // short-circuit
        }

        if (!_.isUndefined(this._zeroEx)) {
            // Since we do not have an index on the `taker` address and want to show
            // transactions where an account is either the `maker` or `taker`, we loop
            // through all fill events, and filter/cache them client-side.
            const filterIndexObj = {};
            await this._startListeningForExchangeLogFillEventsAsync(filterIndexObj);
        }
    }
    private async _startListeningForExchangeLogFillEventsAsync(indexFilterValues: IndexedFilterValues): Promise<void> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        // Fetch historical logs
        await this._fetchHistoricalExchangeLogFillEventsAsync(indexFilterValues);

        // Start a subscription for new logs
        this._zeroEx.exchange.subscribe(
            ExchangeEvents.LogFill,
            indexFilterValues,
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
                    if (!this._doesLogEventInvolveUser(decodedLog)) {
                        return; // We aren't interested in the fill event
                    }
                    this._updateLatestFillsBlockIfNeeded(decodedLog.blockNumber);
                    const fill = await this._convertDecodedLogToFillAsync(decodedLog);
                    if (decodedLogEvent.isRemoved) {
                        tradeHistoryStorage.removeFillFromUser(this._userAddress, this.networkId, fill);
                    } else {
                        tradeHistoryStorage.addFillToUser(this._userAddress, this.networkId, fill);
                    }
                }
            },
        );
    }
    private async _fetchHistoricalExchangeLogFillEventsAsync(indexFilterValues: IndexedFilterValues) {
        const fromBlock = tradeHistoryStorage.getFillsLatestBlock(this._userAddress, this.networkId);
        const blockRange: BlockRange = {
            fromBlock,
            toBlock: 'latest' as BlockParam,
        };
        const decodedLogs = await this._zeroEx.exchange.getLogsAsync<LogFillContractEventArgs>(
            ExchangeEvents.LogFill,
            blockRange,
            indexFilterValues,
        );
        for (const decodedLog of decodedLogs) {
            if (!this._doesLogEventInvolveUser(decodedLog)) {
                continue; // We aren't interested in the fill event
            }
            this._updateLatestFillsBlockIfNeeded(decodedLog.blockNumber);
            const fill = await this._convertDecodedLogToFillAsync(decodedLog);
            tradeHistoryStorage.addFillToUser(this._userAddress, this.networkId, fill);
        }
    }
    private async _convertDecodedLogToFillAsync(decodedLog: LogWithDecodedArgs<LogFillContractEventArgs>) {
        const args = decodedLog.args;
        const blockTimestamp = await this._web3Wrapper.getBlockTimestampAsync(decodedLog.blockHash);
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
    private _doesLogEventInvolveUser(decodedLog: LogWithDecodedArgs<LogFillContractEventArgs>) {
        const args = decodedLog.args;
        const isUserMakerOrTaker = args.maker === this._userAddress || args.taker === this._userAddress;
        return isUserMakerOrTaker;
    }
    private _updateLatestFillsBlockIfNeeded(blockNumber: number) {
        const isBlockPending = _.isNull(blockNumber);
        if (!isBlockPending) {
            // Hack: I've observed the behavior where a client won't register certain fill events
            // and lowering the cache blockNumber fixes the issue. As a quick fix for now, simply
            // set the cached blockNumber 50 below the one returned. This way, upon refreshing, a user
            // would still attempt to re-fetch events from the previous 50 blocks, but won't need to
            // re-fetch all events in all blocks.
            // TODO: Debug if this is a race condition, and apply a more precise fix
            const blockNumberToSet =
                blockNumber - BLOCK_NUMBER_BACK_TRACK < 0 ? 0 : blockNumber - BLOCK_NUMBER_BACK_TRACK;
            tradeHistoryStorage.setFillsLatestBlock(this._userAddress, this.networkId, blockNumberToSet);
        }
    }
    private _stopWatchingExchangeLogFillEvents(): void {
        this._zeroEx.exchange.unsubscribeAll();
    }
    private async _getTokenRegistryTokensByAddressAsync(): Promise<TokenByAddress> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        const tokenRegistryTokens = await this._zeroEx.tokenRegistry.getTokensAsync();

        const tokenByAddress: TokenByAddress = {};
        _.each(tokenRegistryTokens, (t: ZeroExToken, i: number) => {
            // HACK: For now we have a hard-coded list of iconUrls for the dummyTokens
            // TODO: Refactor this out and pull the iconUrl directly from the TokenRegistry
            const iconUrl = configs.ICON_URL_BY_SYMBOL[t.symbol];
            // HACK: Temporarily we hijack the WETH addresses fetched from the tokenRegistry
            // so that we can take our time with actually updating it. This ensures that when
            // we deploy the new WETH page, everyone will re-fill their trackedTokens with the
            // new canonical WETH.
            // TODO: Remove this hack once we've updated the TokenRegistries
            // Airtable task: https://airtable.com/tblFe0Q9JuKJPYbTn/viwsOG2Y97qdIeCIO/recv3VGmIorFzHBVz
            let address = t.address;
            if (configs.SHOULD_DEPRECATE_OLD_WETH_TOKEN && t.symbol === 'WETH') {
                const newEtherTokenAddressIfExists = configs.NEW_WRAPPED_ETHERS[this.networkId];
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
    private async _onPageLoadInitFireAndForgetAsync() {
        await Blockchain._onPageLoadAsync(); // wait for page to load

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

        const provider = await Blockchain._getProviderAsync(injectedWeb3, networkIdIfExists);
        this.networkId = !_.isUndefined(networkIdIfExists)
            ? networkIdIfExists
            : configs.IS_MAINNET_ENABLED ? constants.NETWORK_ID_MAINNET : constants.NETWORK_ID_TESTNET;
        this._dispatcher.updateNetworkId(this.networkId);
        const zeroExConfigs = {
            networkId: this.networkId,
        };
        this._zeroEx = new ZeroEx(provider, zeroExConfigs);
        this._updateProviderName(injectedWeb3);
        const shouldPollUserAddress = true;
        this._web3Wrapper = new Web3Wrapper(this._dispatcher, provider, this.networkId, shouldPollUserAddress);
        await this._postInstantiationOrUpdatingProviderZeroExAsync();
        this._userAddress = await this._web3Wrapper.getFirstAccountIfExistsAsync();
        this._dispatcher.updateUserAddress(this._userAddress);
        await this.fetchTokenInformationAsync();
        this._web3Wrapper.startEmittingNetworkConnectionAndUserBalanceStateAsync();
        await this._rehydrateStoreWithContractEvents();
    }
    // This method should always be run after instantiating or updating the provider
    // of the ZeroEx instance.
    private async _postInstantiationOrUpdatingProviderZeroExAsync() {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        this._exchangeAddress = this._zeroEx.exchange.getContractAddress();
    }
    private _updateProviderName(injectedWeb3: Web3) {
        const doesInjectedWeb3Exist = !_.isUndefined(injectedWeb3);
        const providerName = doesInjectedWeb3Exist
            ? Blockchain._getNameGivenProvider(injectedWeb3.currentProvider)
            : constants.PROVIDER_NAME_PUBLIC;
        this._dispatcher.updateInjectedProviderName(providerName);
    }
    private async _instantiateContractIfExistsAsync(artifact: any, address?: string): Promise<ContractInstance> {
        const c = await contract(artifact);
        const providerObj = this._web3Wrapper.getProviderObj();
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
                throw new Error(BlockchainCallErrs.ContractDoesNotExist);
            }
        }

        try {
            const contractInstance = _.isUndefined(address) ? await c.deployed() : await c.at(address);
            return contractInstance;
        } catch (err) {
            const errMsg = `${err}`;
            utils.consoleLog(`Notice: Error encountered: ${err} ${err.stack}`);
            if (_.includes(errMsg, 'not been deployed to detected network')) {
                throw new Error(BlockchainCallErrs.ContractDoesNotExist);
            } else {
                await errorReporter.reportAsync(err);
                throw new Error(BlockchainCallErrs.UnhandledError);
            }
        }
    }
    private _showFlashMessageIfLedger() {
        if (!_.isUndefined(this._ledgerSubprovider)) {
            this._dispatcher.showFlashMessage('Confirm the transaction on your Ledger Nano S');
        }
    }
} // tslint:disable:max-file-line-count
