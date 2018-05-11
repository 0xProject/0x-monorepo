import {
    BlockParam,
    BlockRange,
    DecodedLogEvent,
    ECSignature,
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
import { EtherscanLinkSuffixes, utils as sharedUtils } from '@0xproject/react-shared';
import {
    InjectedWeb3Subprovider,
    ledgerEthereumBrowserClientFactoryAsync,
    LedgerSubprovider,
    RedundantSubprovider,
    Subprovider,
} from '@0xproject/subproviders';
import { Provider } from '@0xproject/types';
import { BigNumber, intervalUtils, logUtils, promisify } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import contract = require('truffle-contract');
import { BlockchainWatcher } from 'ts/blockchain_watcher';
import { TokenSendCompleted } from 'ts/components/flash_messages/token_send_completed';
import { TransactionSubmitted } from 'ts/components/flash_messages/transaction_submitted';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { tradeHistoryStorage } from 'ts/local_storage/trade_history_storage';
import { Dispatcher } from 'ts/redux/dispatcher';
import {
    BlockchainCallErrs,
    BlockchainErrs,
    ContractInstance,
    Fill,
    Order as PortalOrder,
    Providers,
    ProviderType,
    Side,
    SideToAssetToken,
    Token,
    TokenByAddress,
} from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';
import Web3 = require('web3');
import ProviderEngine = require('web3-provider-engine');
import FilterSubprovider = require('web3-provider-engine/subproviders/filters');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import * as MintableArtifacts from '../contracts/Mintable.json';

const BLOCK_NUMBER_BACK_TRACK = 50;
const GWEI_IN_WEI = 1000000000;

const providerToName: { [provider: string]: string } = {
    [Providers.Metamask]: constants.PROVIDER_NAME_METAMASK,
    [Providers.Parity]: constants.PROVIDER_NAME_PARITY_SIGNER,
    [Providers.Mist]: constants.PROVIDER_NAME_MIST,
};

export class Blockchain {
    public networkId: number;
    public nodeVersion: string;
    private _zeroEx: ZeroEx;
    private _dispatcher: Dispatcher;
    private _web3Wrapper?: Web3Wrapper;
    private _blockchainWatcher?: BlockchainWatcher;
    private _userAddressIfExists: string;
    private _cachedProvider: Provider;
    private _cachedProviderNetworkId: number;
    private _ledgerSubprovider: LedgerSubprovider;
    private _defaultGasPrice: BigNumber;
    private static _getNameGivenProvider(provider: Provider): string {
        const providerType = utils.getProviderType(provider);
        const providerNameIfExists = providerToName[providerType];
        if (_.isUndefined(providerNameIfExists)) {
            return constants.PROVIDER_NAME_GENERIC;
        }
        return providerNameIfExists;
    }
    private static async _getProviderAsync(injectedWeb3: Web3, networkIdIfExists: number): Promise<Provider> {
        const doesInjectedWeb3Exist = !_.isUndefined(injectedWeb3);
        const publicNodeUrlsIfExistsForNetworkId = configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists];
        const isPublicNodeAvailableForNetworkId = !_.isUndefined(publicNodeUrlsIfExistsForNetworkId);

        let provider;
        if (doesInjectedWeb3Exist && isPublicNodeAvailableForNetworkId) {
            // We catch all requests involving a users account and send it to the injectedWeb3
            // instance. All other requests go to the public hosted node.
            provider = new ProviderEngine();
            provider.addProvider(new InjectedWeb3Subprovider(injectedWeb3.currentProvider));
            provider.addProvider(new FilterSubprovider());
            const rpcSubproviders = _.map(publicNodeUrlsIfExistsForNetworkId, publicNodeUrl => {
                return new RpcSubprovider({
                    rpcUrl: publicNodeUrl,
                });
            });
            provider.addProvider(new RedundantSubprovider(rpcSubproviders as Subprovider[]));
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
            const networkId = configs.IS_MAINNET_ENABLED ? constants.NETWORK_ID_MAINNET : constants.NETWORK_ID_KOVAN;
            const rpcSubproviders = _.map(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkId], publicNodeUrl => {
                return new RpcSubprovider({
                    rpcUrl: publicNodeUrl,
                });
            });
            provider.addProvider(new RedundantSubprovider(rpcSubproviders as Subprovider[]));
            provider.start();
        }

        return provider;
    }
    constructor(dispatcher: Dispatcher, isSalePage: boolean = false) {
        this._dispatcher = dispatcher;
        const defaultGasPrice = GWEI_IN_WEI * 30;
        this._defaultGasPrice = new BigNumber(defaultGasPrice);
        // tslint:disable-next-line:no-floating-promises
        this._updateDefaultGasPriceAsync();
        // tslint:disable-next-line:no-floating-promises
        this._onPageLoadInitFireAndForgetAsync();
    }
    public async networkIdUpdatedFireAndForgetAsync(newNetworkId: number): Promise<void> {
        const isConnected = !_.isUndefined(newNetworkId);
        if (!isConnected) {
            this.networkId = newNetworkId;
            this._dispatcher.encounteredBlockchainError(BlockchainErrs.DisconnectedFromEthereumNode);
            this._dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
        } else if (this.networkId !== newNetworkId) {
            this.networkId = newNetworkId;
            this._dispatcher.encounteredBlockchainError(BlockchainErrs.NoError);
            await this.fetchTokenInformationAsync();
            await this._rehydrateStoreWithContractEventsAsync();
        }
    }
    public async userAddressUpdatedFireAndForgetAsync(newUserAddress: string): Promise<void> {
        if (this._userAddressIfExists !== newUserAddress) {
            this._userAddressIfExists = newUserAddress;
            await this.fetchTokenInformationAsync();
            await this._rehydrateStoreWithContractEventsAsync();
        }
    }
    public async nodeVersionUpdatedFireAndForgetAsync(nodeVersion: string): Promise<void> {
        if (this.nodeVersion !== nodeVersion) {
            this.nodeVersion = nodeVersion;
        }
    }
    public async isAddressInTokenRegistryAsync(tokenAddress: string): Promise<boolean> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
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
    public updateLedgerDerivationPathIfExists(path: string): void {
        if (_.isUndefined(this._ledgerSubprovider)) {
            return; // noop
        }
        this._ledgerSubprovider.setPath(path);
    }
    public async updateProviderToLedgerAsync(networkId: number): Promise<void> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');

        const isU2FSupported = await utils.isU2FSupportedAsync();
        if (!isU2FSupported) {
            throw new Error('Cannot update providerType to LEDGER without U2F support');
        }

        // Cache injected provider so that we can switch the user back to it easily
        if (_.isUndefined(this._cachedProvider)) {
            this._cachedProvider = this._web3Wrapper.getProvider();
            this._cachedProviderNetworkId = this.networkId;
        }

        this._blockchainWatcher.destroy();

        delete this._userAddressIfExists;
        this._dispatcher.updateUserAddress(undefined); // Clear old userAddress

        const provider = new ProviderEngine();
        const ledgerWalletConfigs = {
            networkId,
            ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
        };
        this._ledgerSubprovider = new LedgerSubprovider(ledgerWalletConfigs);
        provider.addProvider(this._ledgerSubprovider);
        provider.addProvider(new FilterSubprovider());
        const rpcSubproviders = _.map(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkId], publicNodeUrl => {
            return new RpcSubprovider({
                rpcUrl: publicNodeUrl,
            });
        });
        provider.addProvider(new RedundantSubprovider(rpcSubproviders as Subprovider[]));
        provider.start();
        this.networkId = networkId;
        this._dispatcher.updateNetworkId(this.networkId);
        const shouldPollUserAddress = false;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._blockchainWatcher = new BlockchainWatcher(
            this._dispatcher,
            this._web3Wrapper,
            this.networkId,
            shouldPollUserAddress,
        );
        this._zeroEx.setProvider(provider, this.networkId);
        this._blockchainWatcher.startEmittingNetworkConnectionAndUserBalanceState();
        this._dispatcher.updateProviderType(ProviderType.Ledger);
    }
    public async updateProviderToInjectedAsync(): Promise<void> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');

        if (_.isUndefined(this._cachedProvider)) {
            return; // Going from injected to injected, so we noop
        }

        this._blockchainWatcher.destroy();

        const provider = this._cachedProvider;
        this.networkId = this._cachedProviderNetworkId;

        const shouldPollUserAddress = true;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._blockchainWatcher = new BlockchainWatcher(
            this._dispatcher,
            this._web3Wrapper,
            this.networkId,
            shouldPollUserAddress,
        );

        const userAddresses = await this._web3Wrapper.getAvailableAddressesAsync();
        this._userAddressIfExists = userAddresses[0];

        this._zeroEx.setProvider(provider, this.networkId);

        await this.fetchTokenInformationAsync();
        this._blockchainWatcher.startEmittingNetworkConnectionAndUserBalanceState();
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
            this._userAddressIfExists,
            amountInBaseUnits,
            {
                gasPrice: this._defaultGasPrice,
            },
        );
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
    }
    public async transferAsync(token: Token, toAddress: string, amountInBaseUnits: BigNumber): Promise<void> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        this._showFlashMessageIfLedger();
        const txHash = await this._zeroEx.token.transferAsync(
            token.address,
            this._userAddressIfExists,
            toAddress,
            amountInBaseUnits,
            {
                gasPrice: this._defaultGasPrice,
            },
        );
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const etherScanLinkIfExists = sharedUtils.getEtherScanLinkIfExists(
            txHash,
            this.networkId,
            EtherscanLinkSuffixes.Tx,
        );
        this._dispatcher.showFlashMessage(
            React.createElement(TokenSendCompleted, {
                etherScanLinkIfExists,
                token,
                toAddress,
                amountInBaseUnits,
            }),
        );
    }
    public portalOrderToZeroExOrder(portalOrder: PortalOrder): SignedOrder {
        const exchangeContractAddress = this.getExchangeContractAddressIfExists();
        const zeroExSignedOrder = {
            exchangeContractAddress,
            maker: portalOrder.signedOrder.maker,
            taker: portalOrder.signedOrder.taker,
            makerTokenAddress: portalOrder.signedOrder.makerTokenAddress,
            takerTokenAddress: portalOrder.signedOrder.takerTokenAddress,
            makerTokenAmount: new BigNumber(portalOrder.signedOrder.makerTokenAmount),
            takerTokenAmount: new BigNumber(portalOrder.signedOrder.takerTokenAmount),
            makerFee: new BigNumber(portalOrder.signedOrder.makerFee),
            takerFee: new BigNumber(portalOrder.signedOrder.takerFee),
            expirationUnixTimestampSec: new BigNumber(portalOrder.signedOrder.expirationUnixTimestampSec),
            feeRecipient: portalOrder.signedOrder.feeRecipient,
            ecSignature: portalOrder.signedOrder.ecSignature,
            salt: new BigNumber(portalOrder.signedOrder.salt),
        };
        return zeroExSignedOrder;
    }
    public async fillOrderAsync(signedOrder: SignedOrder, fillTakerTokenAmount: BigNumber): Promise<BigNumber> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        const shouldThrowOnInsufficientBalanceOrAllowance = true;

        this._showFlashMessageIfLedger();
        const txHash = await this._zeroEx.exchange.fillOrderAsync(
            signedOrder,
            fillTakerTokenAmount,
            shouldThrowOnInsufficientBalanceOrAllowance,
            this._userAddressIfExists,
            {
                gasPrice: this._defaultGasPrice,
            },
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
        const txHash = await this._zeroEx.exchange.cancelOrderAsync(signedOrder, cancelTakerTokenAmount, {
            gasPrice: this._defaultGasPrice,
        });
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
    public getExchangeContractAddressIfExists(): string | undefined {
        return this._zeroEx.exchange.getContractAddress();
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
        return Web3Wrapper.isAddress(lowercaseAddress);
    }
    public async pollTokenBalanceAsync(token: Token): Promise<BigNumber> {
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        const [currBalance] = await this.getTokenBalanceAndAllowanceAsync(this._userAddressIfExists, token.address);

        const newTokenBalancePromise = new Promise((resolve: (balance: BigNumber) => void, reject) => {
            const tokenPollInterval = intervalUtils.setAsyncExcludingInterval(
                async () => {
                    const [balance] = await this.getTokenBalanceAndAllowanceAsync(
                        this._userAddressIfExists,
                        token.address,
                    );
                    if (!balance.eq(currBalance)) {
                        intervalUtils.clearAsyncExcludingInterval(tokenPollInterval);
                        resolve(balance);
                    }
                },
                5000,
                (err: Error) => {
                    logUtils.log(`Polling tokenBalance failed: ${err}`);
                    intervalUtils.clearAsyncExcludingInterval(tokenPollInterval);
                    reject(err);
                },
            );
        });

        return newTokenBalancePromise;
    }
    public async signOrderHashAsync(orderHash: string): Promise<ECSignature> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        const makerAddress = this._userAddressIfExists;
        // If makerAddress is undefined, this means they have a web3 instance injected into their browser
        // but no account addresses associated with it.
        if (_.isUndefined(makerAddress)) {
            throw new Error('Tried to send a sign request but user has no associated addresses');
        }

        this._showFlashMessageIfLedger();
        const nodeVersion = await this._web3Wrapper.getNodeVersionAsync();
        const isParityNode = utils.isParityNode(nodeVersion);
        const isTestRpc = utils.isTestRpc(nodeVersion);
        const isLedgerSigner = !_.isUndefined(this._ledgerSubprovider);
        let shouldAddPersonalMessagePrefix = true;
        if ((isParityNode && !isLedgerSigner) || isTestRpc || isLedgerSigner) {
            shouldAddPersonalMessagePrefix = false;
        }
        const ecSignature = await this._zeroEx.signOrderHashAsync(
            orderHash,
            makerAddress,
            shouldAddPersonalMessagePrefix,
        );
        this._dispatcher.updateECSignature(ecSignature);
        return ecSignature;
    }
    public async mintTestTokensAsync(token: Token): Promise<void> {
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        const mintableContract = await this._instantiateContractIfExistsAsync(MintableArtifacts, token.address);
        this._showFlashMessageIfLedger();
        await mintableContract.mint(constants.MINT_AMOUNT, {
            from: this._userAddressIfExists,
            gasPrice: this._defaultGasPrice,
        });
    }
    public async getBalanceInWeiAsync(owner: string): Promise<BigNumber> {
        const balanceInWei = await this._web3Wrapper.getBalanceInWeiAsync(owner);
        return balanceInWei;
    }
    public async convertEthToWrappedEthTokensAsync(etherTokenAddress: string, amount: BigNumber): Promise<void> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        this._showFlashMessageIfLedger();
        const txHash = await this._zeroEx.etherToken.depositAsync(
            etherTokenAddress,
            amount,
            this._userAddressIfExists,
            {
                gasPrice: this._defaultGasPrice,
            },
        );
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
    }
    public async convertWrappedEthTokensToEthAsync(etherTokenAddress: string, amount: BigNumber): Promise<void> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        this._showFlashMessageIfLedger();
        const txHash = await this._zeroEx.etherToken.withdrawAsync(
            etherTokenAddress,
            amount,
            this._userAddressIfExists,
            {
                gasPrice: this._defaultGasPrice,
            },
        );
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
    }
    public async doesContractExistAtAddressAsync(address: string): Promise<boolean> {
        const doesContractExist = await this._web3Wrapper.doesContractExistAtAddressAsync(address);
        return doesContractExist;
    }
    public async getCurrentUserTokenBalanceAndAllowanceAsync(tokenAddress: string): Promise<BigNumber[]> {
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        const tokenBalanceAndAllowance = await this.getTokenBalanceAndAllowanceAsync(
            this._userAddressIfExists,
            tokenAddress,
        );
        return tokenBalanceAndAllowance;
    }
    public async getTokenBalanceAndAllowanceAsync(
        ownerAddressIfExists: string,
        tokenAddress: string,
    ): Promise<BigNumber[]> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');

        if (_.isUndefined(ownerAddressIfExists)) {
            const zero = new BigNumber(0);
            return [zero, zero];
        }
        let balance = new BigNumber(0);
        let allowance = new BigNumber(0);
        if (this._doesUserAddressExist()) {
            balance = await this._zeroEx.token.getBalanceAsync(tokenAddress, ownerAddressIfExists);
            allowance = await this._zeroEx.token.getProxyAllowanceAsync(tokenAddress, ownerAddressIfExists);
        }
        return [balance, allowance];
    }
    public async getUserAccountsAsync(): Promise<string[]> {
        utils.assert(!_.isUndefined(this._zeroEx), 'ZeroEx must be instantiated.');
        const userAccountsIfExists = await this._zeroEx.getAvailableAddressesAsync();
        return userAccountsIfExists;
    }
    // HACK: When a user is using a Ledger, we simply dispatch the selected userAddress, which
    // by-passes the web3Wrapper logic for updating the prevUserAddress. We therefore need to
    // manually update it. This should only be called by the LedgerConfigDialog.
    public updateWeb3WrapperPrevUserAddress(newUserAddress: string): void {
        this._blockchainWatcher.updatePrevUserAddress(newUserAddress);
    }
    public destroy(): void {
        this._blockchainWatcher.destroy();
        this._stopWatchingExchangeLogFillEvents();
    }
    public async fetchTokenInformationAsync(): Promise<void> {
        utils.assert(
            !_.isUndefined(this.networkId),
            'Cannot call fetchTokenInformationAsync if disconnected from Ethereum node',
        );

        this._dispatcher.updateBlockchainIsLoaded(false);

        const tokenRegistryTokensByAddress = await this._getTokenRegistryTokensByAddressAsync();

        const trackedTokensByAddress = _.isUndefined(this._userAddressIfExists)
            ? {}
            : trackedTokenStorage.getTrackedTokensByAddress(this._userAddressIfExists, this.networkId);
        const tokenRegistryTokens = _.values(tokenRegistryTokensByAddress);
        const tokenRegistryTokenSymbols = _.map(tokenRegistryTokens, t => t.symbol);
        const defaultTrackedTokensInRegistry = _.intersection(
            tokenRegistryTokenSymbols,
            configs.DEFAULT_TRACKED_TOKEN_SYMBOLS,
        );
        if (defaultTrackedTokensInRegistry.length !== configs.DEFAULT_TRACKED_TOKEN_SYMBOLS.length) {
            this._dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            this._dispatcher.encounteredBlockchainError(BlockchainErrs.DefaultTokensNotInTokenRegistry);
            const err = new Error(
                `Default tracked tokens (${JSON.stringify(
                    configs.DEFAULT_TRACKED_TOKEN_SYMBOLS,
                )}) not found in tokenRegistry: ${JSON.stringify(tokenRegistryTokens)}`,
            );
            await errorReporter.reportAsync(err);
            return;
        }
        if (_.isEmpty(trackedTokensByAddress)) {
            _.each(configs.DEFAULT_TRACKED_TOKEN_SYMBOLS, symbol => {
                const token = _.find(tokenRegistryTokens, t => t.symbol === symbol);
                token.isTracked = true;
                trackedTokensByAddress[token.address] = token;
            });
            if (!_.isUndefined(this._userAddressIfExists)) {
                _.each(trackedTokensByAddress, (token: Token, address: string) => {
                    trackedTokenStorage.addTrackedTokenToUser(this._userAddressIfExists, this.networkId, token);
                });
            }
        } else {
            // Properly set all tokenRegistry tokens `isTracked` to true if they are in the existing trackedTokens array
            _.each(trackedTokensByAddress, (trackedToken: Token, address: string) => {
                if (!_.isUndefined(tokenRegistryTokensByAddress[address])) {
                    tokenRegistryTokensByAddress[address].isTracked = true;
                }
            });
        }
        const allTokensByAddress = {
            ...tokenRegistryTokensByAddress,
            ...trackedTokensByAddress,
        };
        const allTokens = _.values(allTokensByAddress);
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
        this._dispatcher.batchDispatch(allTokensByAddress, this.networkId, this._userAddressIfExists, sideToAssetToken);

        this._dispatcher.updateBlockchainIsLoaded(true);
    }
    private async _showEtherScanLinkAndAwaitTransactionMinedAsync(
        txHash: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const etherScanLinkIfExists = sharedUtils.getEtherScanLinkIfExists(
            txHash,
            this.networkId,
            EtherscanLinkSuffixes.Tx,
        );
        this._dispatcher.showFlashMessage(
            React.createElement(TransactionSubmitted, {
                etherScanLinkIfExists,
            }),
        );
        const receipt = await this._zeroEx.awaitTransactionMinedAsync(txHash);
        return receipt;
    }
    private _doesUserAddressExist(): boolean {
        return !_.isUndefined(this._userAddressIfExists);
    }
    private async _rehydrateStoreWithContractEventsAsync(): Promise<void> {
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
                        tradeHistoryStorage.removeFillFromUser(this._userAddressIfExists, this.networkId, fill);
                    } else {
                        tradeHistoryStorage.addFillToUser(this._userAddressIfExists, this.networkId, fill);
                    }
                }
            },
        );
    }
    private async _fetchHistoricalExchangeLogFillEventsAsync(indexFilterValues: IndexedFilterValues): Promise<void> {
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        const fromBlock = tradeHistoryStorage.getFillsLatestBlock(this._userAddressIfExists, this.networkId);
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
            tradeHistoryStorage.addFillToUser(this._userAddressIfExists, this.networkId, fill);
        }
    }
    private async _convertDecodedLogToFillAsync(
        decodedLog: LogWithDecodedArgs<LogFillContractEventArgs>,
    ): Promise<Fill> {
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
    private _doesLogEventInvolveUser(decodedLog: LogWithDecodedArgs<LogFillContractEventArgs>): boolean {
        const args = decodedLog.args;
        const isUserMakerOrTaker = args.maker === this._userAddressIfExists || args.taker === this._userAddressIfExists;
        return isUserMakerOrTaker;
    }
    private _updateLatestFillsBlockIfNeeded(blockNumber: number): void {
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

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
            tradeHistoryStorage.setFillsLatestBlock(this._userAddressIfExists, this.networkId, blockNumberToSet);
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
            const token: Token = {
                iconUrl,
                address: t.address,
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
    private async _onPageLoadInitFireAndForgetAsync(): Promise<void> {
        await utils.onPageLoadAsync(); // wait for page to load

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
            : configs.IS_MAINNET_ENABLED ? constants.NETWORK_ID_MAINNET : constants.NETWORK_ID_KOVAN;
        this._dispatcher.updateNetworkId(this.networkId);
        const zeroExConfigs = {
            networkId: this.networkId,
        };
        this._zeroEx = new ZeroEx(provider, zeroExConfigs);
        this._updateProviderName(injectedWeb3);
        const shouldPollUserAddress = true;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._blockchainWatcher = new BlockchainWatcher(
            this._dispatcher,
            this._web3Wrapper,
            this.networkId,
            shouldPollUserAddress,
        );

        const userAddresses = await this._web3Wrapper.getAvailableAddressesAsync();
        this._userAddressIfExists = userAddresses[0];
        this._dispatcher.updateUserAddress(this._userAddressIfExists);
        await this.fetchTokenInformationAsync();
        this._blockchainWatcher.startEmittingNetworkConnectionAndUserBalanceState();
        await this._rehydrateStoreWithContractEventsAsync();
    }
    private _updateProviderName(injectedWeb3: Web3): void {
        const doesInjectedWeb3Exist = !_.isUndefined(injectedWeb3);
        const providerName = doesInjectedWeb3Exist
            ? Blockchain._getNameGivenProvider(injectedWeb3.currentProvider)
            : constants.PROVIDER_NAME_PUBLIC;
        this._dispatcher.updateInjectedProviderName(providerName);
    }
    private async _instantiateContractIfExistsAsync(artifact: any, address?: string): Promise<ContractInstance> {
        const c = await contract(artifact);
        const providerObj = this._web3Wrapper.getProvider();
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
                logUtils.log(`Contract does not exist: ${artifact.contract_name} at ${contractAddress}`);
                throw new Error(BlockchainCallErrs.ContractDoesNotExist);
            }
        }

        try {
            const contractInstance = _.isUndefined(address) ? await c.deployed() : await c.at(address);
            return contractInstance;
        } catch (err) {
            const errMsg = `${err}`;
            logUtils.log(`Notice: Error encountered: ${err} ${err.stack}`);
            if (_.includes(errMsg, 'not been deployed to detected network')) {
                throw new Error(BlockchainCallErrs.ContractDoesNotExist);
            } else {
                await errorReporter.reportAsync(err);
                throw new Error(BlockchainCallErrs.UnhandledError);
            }
        }
    }
    private _showFlashMessageIfLedger(): void {
        if (!_.isUndefined(this._ledgerSubprovider)) {
            this._dispatcher.showFlashMessage('Confirm the transaction on your Ledger Nano S');
        }
    }
    private async _updateDefaultGasPriceAsync(): Promise<void> {
        try {
            const gasInfo = await backendClient.getGasInfoAsync();
            const gasPriceInGwei = new BigNumber(gasInfo.average / 10);
            const gasPriceInWei = gasPriceInGwei.mul(1000000000);
            this._defaultGasPrice = gasPriceInWei;
        } catch (err) {
            return;
        }
    }
} // tslint:disable:max-file-line-count
