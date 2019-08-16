import {
    BlockRange,
    ContractWrappers,
    DecodedLogEvent,
    ERC20TokenContract,
    ExchangeCancelEventArgs,
    ExchangeEventArgs,
    ExchangeEvents,
    ExchangeFillEventArgs,
    IndexedFilterValues,
    WETH9Contract,
} from '@0x/contract-wrappers';
import { assetDataUtils, orderHashUtils, signatureUtils } from '@0x/order-utils';
import {
    ledgerEthereumBrowserClientFactoryAsync,
    LedgerSubprovider,
    MetamaskSubprovider,
    RedundantSubprovider,
    RPCSubprovider,
    SignerSubprovider,
    Web3ProviderEngine,
} from '@0x/subproviders';
import { SignedOrder, Token as ZeroExToken } from '@0x/types';
import { BigNumber, intervalUtils, logUtils, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import {
    BlockParam,
    LogWithDecodedArgs,
    Provider,
    TransactionReceiptWithDecodedLogs,
    ZeroExProvider,
} from 'ethereum-types';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import contract from 'truffle-contract';
import { BlockchainWatcher } from 'ts/blockchain_watcher';
import { AssetSendCompleted } from 'ts/components/flash_messages/asset_send_completed';
import { TransactionSubmitted } from 'ts/components/flash_messages/transaction_submitted';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { tradeHistoryStorage } from 'ts/local_storage/trade_history_storage';
import { Dispatcher } from 'ts/redux/dispatcher';
import {
    BlockchainCallErrs,
    BlockchainErrs,
    ContractInstance,
    EtherscanLinkSuffixes,
    Fill,
    InjectedProvider,
    InjectedProviderObservable,
    InjectedProviderUpdate,
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
import { fakeTokenRegistry } from 'ts/utils/fake_token_registry';
import { tokenAddressOverrides } from 'ts/utils/token_address_overrides';
import { utils } from 'ts/utils/utils';

import MintableArtifacts from '../contracts/Mintable.json';

const BLOCK_NUMBER_BACK_TRACK = 50;
const GWEI_IN_WEI = 1000000000;

const providerToName: { [provider: string]: string } = {
    [Providers.Metamask]: constants.PROVIDER_NAME_METAMASK,
    [Providers.Parity]: constants.PROVIDER_NAME_PARITY_SIGNER,
    [Providers.Mist]: constants.PROVIDER_NAME_MIST,
    [Providers.CoinbaseWallet]: constants.PROVIDER_NAME_COINBASE_WALLET,
    [Providers.Cipher]: constants.PROVIDER_NAME_CIPHER,
};

export class Blockchain {
    public networkId: number;
    public nodeVersion: string;
    private _contractWrappers: ContractWrappers;
    private readonly _dispatcher: Dispatcher;
    private _web3Wrapper?: Web3Wrapper;
    private _blockchainWatcher?: BlockchainWatcher;
    private _injectedProviderObservable?: InjectedProviderObservable;
    private readonly _injectedProviderUpdateHandler: (update: InjectedProviderUpdate) => Promise<void>;
    private _userAddressIfExists: string;
    private _ledgerSubprovider: LedgerSubprovider;
    private _defaultGasPrice: BigNumber;
    private _watchGasPriceIntervalId: NodeJS.Timer;
    private _injectedProviderIfExists?: InjectedProvider;
    private static _getNameGivenProvider(provider: ZeroExProvider): string {
        const providerType = utils.getProviderType(provider);
        const providerNameIfExists = providerToName[providerType];
        if (providerNameIfExists === undefined) {
            return constants.PROVIDER_NAME_GENERIC;
        }
        return providerNameIfExists;
    }
    private static async _getProviderAsync(
        injectedProviderIfExists?: InjectedProvider,
        networkIdIfExists?: number,
        shouldUserLedgerProvider: boolean = false,
    ): Promise<[Provider, LedgerSubprovider | undefined]> {
        const doesInjectedProviderExist = injectedProviderIfExists !== undefined;
        const isNetworkIdAvailable = networkIdIfExists !== undefined;
        const publicNodeUrlsIfExistsForNetworkId = configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists];
        const isPublicNodeAvailableForNetworkId = publicNodeUrlsIfExistsForNetworkId !== undefined;

        if (shouldUserLedgerProvider && isNetworkIdAvailable) {
            const isU2FSupported = await utils.isU2FSupportedAsync();
            if (!isU2FSupported) {
                throw new Error('Cannot update providerType to LEDGER without U2F support');
            }
            const provider = new Web3ProviderEngine();
            const ledgerWalletConfigs = {
                networkId: networkIdIfExists,
                ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
            };
            const ledgerSubprovider = new LedgerSubprovider(ledgerWalletConfigs);
            provider.addProvider(ledgerSubprovider);
            const rpcSubproviders = _.map(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists], publicNodeUrl => {
                return new RPCSubprovider(publicNodeUrl);
            });
            provider.addProvider(new RedundantSubprovider(rpcSubproviders));
            providerUtils.startProviderEngine(provider);
            return [provider, ledgerSubprovider];
        } else if (doesInjectedProviderExist && isPublicNodeAvailableForNetworkId) {
            // We catch all requests involving a users account and send it to the injectedWeb3
            // instance. All other requests go to the public hosted node.
            const provider = new Web3ProviderEngine();
            const providerName = this._getNameGivenProvider(injectedProviderIfExists);
            // Wrap Metamask in a compatability wrapper MetamaskSubprovider (to handle inconsistencies)
            const signerSubprovider =
                providerName === constants.PROVIDER_NAME_METAMASK
                    ? new MetamaskSubprovider(injectedProviderIfExists)
                    : new SignerSubprovider(injectedProviderIfExists);
            provider.addProvider(signerSubprovider);
            const rpcSubproviders = _.map(publicNodeUrlsIfExistsForNetworkId, publicNodeUrl => {
                return new RPCSubprovider(publicNodeUrl);
            });
            provider.addProvider(new RedundantSubprovider(rpcSubproviders));
            providerUtils.startProviderEngine(provider);
            return [provider, undefined];
        } else if (doesInjectedProviderExist) {
            // Since no public node for this network, all requests go to injectedWeb3 instance
            return [injectedProviderIfExists, undefined];
        } else {
            // If no injectedWeb3 instance, all requests fallback to our public hosted mainnet/testnet node
            // We do this so that users can still browse the 0x Portal DApp even if they do not have web3
            // injected into their browser.
            const provider = new Web3ProviderEngine();
            const networkId = constants.NETWORK_ID_MAINNET;
            const rpcSubproviders = _.map(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkId], publicNodeUrl => {
                return new RPCSubprovider(publicNodeUrl);
            });
            provider.addProvider(new RedundantSubprovider(rpcSubproviders));
            providerUtils.startProviderEngine(provider);
            return [provider, undefined];
        }
    }
    constructor(dispatcher: Dispatcher) {
        this._dispatcher = dispatcher;
        const defaultGasPrice = GWEI_IN_WEI * 40;
        this._defaultGasPrice = new BigNumber(defaultGasPrice);
        // We need a unique reference to this function so we can use it to unsubcribe.
        this._injectedProviderUpdateHandler = this._handleInjectedProviderUpdateAsync.bind(this);
        // tslint:disable-next-line:no-floating-promises
        this._onPageLoadInitFireAndForgetAsync();
    }
    public async networkIdUpdatedFireAndForgetAsync(newNetworkId: number): Promise<void> {
        const isConnected = newNetworkId !== undefined;
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
        const tokens = fakeTokenRegistry[this.networkId];
        const tokenIfExists = _.find(tokens, { address: tokenAddress });

        // HACK: Override token addresses on testnets
        const tokenSymbolToAddressOverrides = tokenAddressOverrides[this.networkId];
        let isTokenAddressInOverrides = false;
        if (tokenSymbolToAddressOverrides !== undefined) {
            isTokenAddressInOverrides = _.values(tokenSymbolToAddressOverrides).includes(tokenAddress);
        }
        return tokenIfExists !== undefined || isTokenAddressInOverrides;
    }
    public getLedgerDerivationPathIfExists(): string {
        if (this._ledgerSubprovider === undefined) {
            return undefined;
        }
        const path = this._ledgerSubprovider.getPath();
        return path;
    }
    public updateLedgerDerivationPathIfExists(path: string): void {
        if (this._ledgerSubprovider === undefined) {
            return; // noop
        }
        this._ledgerSubprovider.setPath(path);
    }
    public async updateProviderToLedgerAsync(networkId: number): Promise<void> {
        const shouldPollUserAddress = false;
        const shouldUserLedgerProvider = true;
        await this._resetOrInitializeAsync(networkId, shouldPollUserAddress, shouldUserLedgerProvider);
    }
    public async updateProviderToInjectedAsync(): Promise<void> {
        const shouldPollUserAddress = true;
        const shouldUserLedgerProvider = false;
        this._dispatcher.updateBlockchainIsLoaded(false);
        // We don't want to be out of sync with the network the injected provider declares.
        const networkId = await this._getInjectedProviderNetworkIdIfExistsAsync();
        await this._resetOrInitializeAsync(networkId, shouldPollUserAddress, shouldUserLedgerProvider);
    }
    public async setProxyAllowanceAsync(token: Token, amountInBaseUnits: BigNumber): Promise<void> {
        utils.assert(this.isValidAddress(token.address), BlockchainCallErrs.TokenAddressIsInvalid);
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);
        utils.assert(this._contractWrappers !== undefined, 'Contract Wrappers must be instantiated.');

        this._showFlashMessageIfLedger();
        const erc20Token = new ERC20TokenContract(token.address, this._contractWrappers.getProvider());
        const txHash = await erc20Token.approve.sendTransactionAsync(
            this._contractWrappers.contractAddresses.erc20Proxy,
            amountInBaseUnits,
            {
                from: this._userAddressIfExists,
                gasPrice: this._defaultGasPrice,
            },
        );
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
    }
    public async sendAsync(toAddress: string, amountInBaseUnits: BigNumber): Promise<void> {
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);
        const transaction = {
            from: this._userAddressIfExists,
            to: toAddress,
            value: amountInBaseUnits,
            gasPrice: this._defaultGasPrice,
        };
        this._showFlashMessageIfLedger();
        const txHash = await this._web3Wrapper.sendTransactionAsync(transaction);
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const etherScanLinkIfExists = utils.getEtherScanLinkIfExists(txHash, this.networkId, EtherscanLinkSuffixes.Tx);
        this._dispatcher.showFlashMessage(
            React.createElement(AssetSendCompleted, {
                etherScanLinkIfExists,
                toAddress,
                amountInBaseUnits,
                decimals: constants.DECIMAL_PLACES_ETH,
                symbol: constants.ETHER_SYMBOL,
            }),
        );
    }
    public async transferAsync(token: Token, toAddress: string, amountInBaseUnits: BigNumber): Promise<void> {
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        this._showFlashMessageIfLedger();
        const erc20Token = new ERC20TokenContract(token.address, this._contractWrappers.getProvider());
        const txHash = await erc20Token.transfer.validateAndSendTransactionAsync(toAddress, amountInBaseUnits, {
            from: this._userAddressIfExists,
            gasPrice: this._defaultGasPrice,
        });
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const etherScanLinkIfExists = utils.getEtherScanLinkIfExists(txHash, this.networkId, EtherscanLinkSuffixes.Tx);
        this._dispatcher.showFlashMessage(
            React.createElement(AssetSendCompleted, {
                etherScanLinkIfExists,
                toAddress,
                amountInBaseUnits,
                decimals: token.decimals,
                symbol: token.symbol,
            }),
        );
    }
    public async fillOrderAsync(signedOrder: SignedOrder, fillTakerTokenAmount: BigNumber): Promise<BigNumber> {
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);
        this._showFlashMessageIfLedger();
        const txHash = await this._contractWrappers.exchange.fillOrder.validateAndSendTransactionAsync(
            signedOrder,
            fillTakerTokenAmount,
            signedOrder.signature,
            {
                from: this._userAddressIfExists,
                gasPrice: this._defaultGasPrice,
            },
        );
        const receipt = await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const logs: Array<LogWithDecodedArgs<ExchangeEventArgs>> = receipt.logs as any;
        const logFill = _.find(logs, { event: ExchangeEvents.Fill });
        const args = (logFill.args as any) as ExchangeFillEventArgs;
        const takerAssetFilledAmount = args.takerAssetFilledAmount;
        return takerAssetFilledAmount;
    }
    public async cancelOrderAsync(signedOrder: SignedOrder): Promise<string> {
        this._showFlashMessageIfLedger();
        const txHash = await this._contractWrappers.exchange.cancelOrder.validateAndSendTransactionAsync(signedOrder, {
            from: signedOrder.makerAddress,
            gasPrice: this._defaultGasPrice,
        });
        const receipt = await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
        const logs: Array<LogWithDecodedArgs<ExchangeEventArgs>> = receipt.logs as any;
        const logCancel = _.find(logs, { event: ExchangeEvents.Cancel });
        const args = (logCancel.args as any) as ExchangeCancelEventArgs;
        const cancelledOrderHash = args.orderHash;
        return cancelledOrderHash;
    }
    public async getUnavailableTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        utils.assert(orderHashUtils.isValidOrderHash(orderHash), 'Must be valid orderHash');
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');
        const unavailableTakerAmount = await this._contractWrappers.exchange.filled.callAsync(orderHash);
        return unavailableTakerAmount;
    }
    public getExchangeContractAddressIfExists(): string | undefined {
        return this._contractWrappers.exchange.address;
    }
    public async validateFillOrderThrowIfInvalidAsync(
        signedOrder: SignedOrder,
        fillTakerTokenAmount: BigNumber,
        takerAddress: string,
    ): Promise<void> {
        await this._contractWrappers.exchange.fillOrder.callAsync(
            signedOrder,
            fillTakerTokenAmount,
            signedOrder.signature,
            {
                from: takerAddress,
            },
        );
    }
    public isValidAddress(address: string): boolean {
        const lowercaseAddress = address.toLowerCase();
        return Web3Wrapper.isAddress(lowercaseAddress);
    }
    public async isValidSignatureAsync(data: string, signature: string, signerAddress: string): Promise<boolean> {
        const result = await signatureUtils.isValidSignatureAsync(
            this._contractWrappers.getProvider(),
            data,
            signature,
            signerAddress,
        );
        return result;
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
    public async signOrderHashAsync(orderHash: string): Promise<string> {
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');
        const makerAddress = this._userAddressIfExists;
        // If makerAddress is undefined, this means they have a web3 instance injected into their browser
        // but no account addresses associated with it.
        if (makerAddress === undefined) {
            throw new Error('Tried to send a sign request but user has no associated addresses');
        }
        this._showFlashMessageIfLedger();
        const provider = this._contractWrappers.getProvider();
        const ecSignatureString = await signatureUtils.ecSignHashAsync(provider, orderHash, makerAddress);
        this._dispatcher.updateSignature(ecSignatureString);
        return ecSignatureString;
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
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        this._showFlashMessageIfLedger();
        const etherToken = new WETH9Contract(etherTokenAddress, this._contractWrappers.getProvider());
        const txHash = await etherToken.deposit.validateAndSendTransactionAsync({
            value: amount,
            from: this._userAddressIfExists,
            gasPrice: this._defaultGasPrice,
        });
        await this._showEtherScanLinkAndAwaitTransactionMinedAsync(txHash);
    }
    public async convertWrappedEthTokensToEthAsync(etherTokenAddress: string, amount: BigNumber): Promise<void> {
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        this._showFlashMessageIfLedger();
        const etherToken = new WETH9Contract(etherTokenAddress, this._contractWrappers.getProvider());
        const txHash = await etherToken.withdraw.validateAndSendTransactionAsync(amount, {
            from: this._userAddressIfExists,
            gasPrice: this._defaultGasPrice,
        });
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
    ): Promise<[BigNumber, BigNumber]> {
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');

        if (ownerAddressIfExists === undefined) {
            const zero = new BigNumber(0);
            return [zero, zero];
        }
        let balance = new BigNumber(0);
        let allowance = new BigNumber(0);
        if (this._doesUserAddressExist()) {
            const erc20Token = new ERC20TokenContract(tokenAddress, this._contractWrappers.getProvider());
            [balance, allowance] = await Promise.all([
                erc20Token.balanceOf.callAsync(ownerAddressIfExists),
                erc20Token.allowance.callAsync(
                    ownerAddressIfExists,
                    this._contractWrappers.contractAddresses.erc20Proxy,
                ),
            ]);
        }
        return [balance, allowance];
    }
    public async getUserAccountsAsync(): Promise<string[]> {
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');
        const provider = this._contractWrappers.getProvider();
        const web3Wrapper = new Web3Wrapper(provider);
        const userAccountsIfExists = await web3Wrapper.getAvailableAddressesAsync();
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
        if (this._injectedProviderObservable) {
            this._injectedProviderObservable.unsubscribe(this._injectedProviderUpdateHandler);
        }
        this._stopWatchingExchangeLogFillEvents();
        this._stopWatchingGasPrice();
    }
    public async fetchTokenInformationAsync(): Promise<void> {
        utils.assert(
            this.networkId !== undefined,
            'Cannot call fetchTokenInformationAsync if disconnected from Ethereum node',
        );

        this._dispatcher.updateBlockchainIsLoaded(false);

        const tokenRegistryTokensByAddress = await this._getTokenRegistryTokensByAddressAsync();

        const trackedTokensByAddress =
            this._userAddressIfExists === undefined
                ? {}
                : trackedTokenStorage.getTrackedTokensByAddress(this._userAddressIfExists, this.networkId);
        const tokenRegistryTokens = _.values(tokenRegistryTokensByAddress);
        const tokenRegistryTokenSymbols = _.map(tokenRegistryTokens, t => t.symbol);
        const defaultTrackedTokensInRegistry = _.intersection(
            tokenRegistryTokenSymbols,
            configs.DEFAULT_TRACKED_TOKEN_SYMBOLS,
        );
        const currentTimestamp = moment().unix();
        if (defaultTrackedTokensInRegistry.length !== configs.DEFAULT_TRACKED_TOKEN_SYMBOLS.length) {
            this._dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            this._dispatcher.encounteredBlockchainError(BlockchainErrs.DefaultTokensNotInTokenRegistry);
            const err = new Error(
                `Default tracked tokens (${JSON.stringify(
                    configs.DEFAULT_TRACKED_TOKEN_SYMBOLS,
                )}) not found in tokenRegistry: ${JSON.stringify(tokenRegistryTokens)}`,
            );
            errorReporter.report(err);
            return;
        }
        if (_.isEmpty(trackedTokensByAddress)) {
            _.each(configs.DEFAULT_TRACKED_TOKEN_SYMBOLS, symbol => {
                const token = _.find(tokenRegistryTokens, t => t.symbol === symbol);
                token.trackedTimestamp = currentTimestamp;
                trackedTokensByAddress[token.address] = token;
            });
            if (this._userAddressIfExists !== undefined) {
                _.each(trackedTokensByAddress, (token: Token) => {
                    trackedTokenStorage.addTrackedTokenToUser(this._userAddressIfExists, this.networkId, token);
                });
            }
        } else {
            // Properly set all tokenRegistry tokens `trackedTimestamp` if they are in the existing trackedTokens array
            _.each(trackedTokensByAddress, (trackedToken: Token, address: string) => {
                if (tokenRegistryTokensByAddress[address] !== undefined) {
                    tokenRegistryTokensByAddress[address].trackedTimestamp = trackedToken.trackedTimestamp;
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
    private async _getInjectedProviderIfExistsAsync(): Promise<InjectedProvider | undefined> {
        if (this._injectedProviderIfExists !== undefined) {
            return this._injectedProviderIfExists;
        }
        let injectedProviderIfExists = (window as any).ethereum;
        if (injectedProviderIfExists !== undefined) {
            if (injectedProviderIfExists.enable !== undefined) {
                try {
                    await injectedProviderIfExists.enable();
                } catch (err) {
                    errorReporter.report(err);
                }
            }
        } else {
            const injectedWeb3IfExists = (window as any).web3;
            if (injectedWeb3IfExists !== undefined && injectedWeb3IfExists.currentProvider !== undefined) {
                injectedProviderIfExists = injectedWeb3IfExists.currentProvider;
            } else {
                return undefined;
            }
        }
        const standardizedInjectedProvider = providerUtils.standardizeOrThrow(injectedProviderIfExists);
        this._injectedProviderIfExists = standardizedInjectedProvider;
        return standardizedInjectedProvider;
    }
    private async _getInjectedProviderNetworkIdIfExistsAsync(): Promise<number | undefined> {
        // If the user has an injectedWeb3 instance that is disconnected from a backing
        // Ethereum node, this call will throw. We need to handle this case gracefully
        const injectedProviderIfExists = await this._getInjectedProviderIfExistsAsync();
        let networkIdIfExists: number;
        if (injectedProviderIfExists !== undefined) {
            try {
                const injectedWeb3Wrapper = new Web3Wrapper(injectedProviderIfExists);
                networkIdIfExists = await injectedWeb3Wrapper.getNetworkIdAsync();
            } catch (err) {
                // Ignore error and proceed with networkId undefined
            }
        }
        return networkIdIfExists;
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
        const provider = this._contractWrappers.getProvider();
        const web3Wrapper = new Web3Wrapper(provider);
        const exchangeAbi = this._contractWrappers.exchange.abi;
        web3Wrapper.abiDecoder.addABI(exchangeAbi);
        const receipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        return receipt;
    }
    private _doesUserAddressExist(): boolean {
        return this._userAddressIfExists !== undefined;
    }
    private async _handleInjectedProviderUpdateAsync(update: InjectedProviderUpdate): Promise<void> {
        if (update.networkVersion === 'loading' || this._ledgerSubprovider !== undefined) {
            return;
        }
        const updatedNetworkId = _.parseInt(update.networkVersion);
        if (this.networkId === updatedNetworkId) {
            return;
        }
        const shouldPollUserAddress = true;
        const shouldUserLedgerProvider = false;
        await this._resetOrInitializeAsync(updatedNetworkId, shouldPollUserAddress, shouldUserLedgerProvider);
    }
    private async _rehydrateStoreWithContractEventsAsync(): Promise<void> {
        // Ensure we are only ever listening to one set of events
        this._stopWatchingExchangeLogFillEvents();

        if (!this._doesUserAddressExist()) {
            return; // short-circuit
        }

        if (this._contractWrappers !== undefined) {
            // Since we do not have an index on the `taker` address and want to show
            // transactions where an account is either the `maker` or `taker`, we loop
            // through all fill events, and filter/cache them client-side.
            const filterIndexObj = {};
            await this._startListeningForExchangeLogFillEventsAsync(filterIndexObj);
        }
    }
    private async _startListeningForExchangeLogFillEventsAsync(indexFilterValues: IndexedFilterValues): Promise<void> {
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        // Fetch historical logs
        await this._fetchHistoricalExchangeLogFillEventsAsync(indexFilterValues);

        // Start a subscription for new logs
        this._contractWrappers.exchange.subscribe(
            ExchangeEvents.Fill,
            indexFilterValues,
            async (err: Error, decodedLogEvent: DecodedLogEvent<ExchangeFillEventArgs>) => {
                if (err) {
                    // Note: it's not entirely clear from the documentation which
                    // errors will be thrown by `watch`. For now, let's log the error
                    // to rollbar and stop watching when one occurs
                    errorReporter.report(err); // fire and forget
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
        const decodedLogs = await this._contractWrappers.exchange.getLogsAsync<ExchangeFillEventArgs>(
            ExchangeEvents.Fill,
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
    private async _convertDecodedLogToFillAsync(decodedLog: LogWithDecodedArgs<ExchangeFillEventArgs>): Promise<Fill> {
        const args = decodedLog.args;
        const blockTimestamp = await this._web3Wrapper.getBlockTimestampAsync(decodedLog.blockHash);
        const makerToken = assetDataUtils.decodeERC20AssetData(args.makerAssetData).tokenAddress;
        const takerToken = assetDataUtils.decodeERC20AssetData(args.takerAssetData).tokenAddress;
        const fill = {
            filledTakerTokenAmount: args.takerAssetFilledAmount,
            filledMakerTokenAmount: args.makerAssetFilledAmount,
            logIndex: decodedLog.logIndex,
            maker: args.makerAddress,
            orderHash: args.orderHash,
            taker: args.takerAddress,
            makerToken,
            takerToken,
            paidMakerFee: args.makerFeePaid,
            paidTakerFee: args.takerFeePaid,
            transactionHash: decodedLog.transactionHash,
            blockTimestamp,
        };
        return fill;
    }
    private _doesLogEventInvolveUser(decodedLog: LogWithDecodedArgs<ExchangeFillEventArgs>): boolean {
        const args = decodedLog.args;
        const isUserMakerOrTaker = args.maker === this._userAddressIfExists || args.taker === this._userAddressIfExists;
        return isUserMakerOrTaker;
    }
    private _updateLatestFillsBlockIfNeeded(blockNumber: number): void {
        utils.assert(this._doesUserAddressExist(), BlockchainCallErrs.UserHasNoAssociatedAddresses);

        const isBlockPending = blockNumber === null;
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
        this._contractWrappers.exchange.unsubscribeAll();
    }
    private async _getTokenRegistryTokensByAddressAsync(): Promise<TokenByAddress> {
        let tokenRegistryTokens;
        if (this.networkId === constants.NETWORK_ID_MAINNET) {
            tokenRegistryTokens = await backendClient.getTokenInfosAsync();
        } else {
            tokenRegistryTokens = fakeTokenRegistry[this.networkId];
            const tokenSymbolToAddressOverrides = tokenAddressOverrides[this.networkId];
            if (tokenAddressOverrides !== undefined) {
                // HACK: Override token addresses on testnets
                tokenRegistryTokens = _.map(tokenRegistryTokens, (token: ZeroExToken) => {
                    const overrideIfExists = tokenSymbolToAddressOverrides[token.symbol];
                    if (overrideIfExists !== undefined) {
                        return {
                            ...token,
                            address: overrideIfExists,
                        };
                    }
                    return token;
                });
            }
        }
        const tokenByAddress: TokenByAddress = {};
        _.each(tokenRegistryTokens, (t: ZeroExToken) => {
            // HACK: For now we have a hard-coded list of iconUrls for the dummyTokens
            // TODO: Refactor this out and pull the iconUrl directly from the TokenRegistry
            const iconUrl = utils.getTokenIconUrl(t.symbol);
            const token: Token = {
                iconUrl,
                address: t.address,
                name: t.name,
                symbol: t.symbol,
                decimals: t.decimals,
                trackedTimestamp: undefined,
                isRegistered: true,
            };
            tokenByAddress[token.address] = token;
        });
        return tokenByAddress;
    }
    private async _onPageLoadInitFireAndForgetAsync(): Promise<void> {
        await utils.onPageLoadPromise; // wait for page to load
        const networkIdIfExists = await this._getInjectedProviderNetworkIdIfExistsAsync();
        this.networkId = networkIdIfExists !== undefined ? networkIdIfExists : constants.NETWORK_ID_MAINNET;
        const injectedProviderIfExists = await this._getInjectedProviderIfExistsAsync();
        if (injectedProviderIfExists !== undefined) {
            const injectedProviderObservable = injectedProviderIfExists.publicConfigStore;
            if (injectedProviderObservable !== undefined && this._injectedProviderObservable === undefined) {
                this._injectedProviderObservable = injectedProviderObservable;
                this._injectedProviderObservable.subscribe(this._injectedProviderUpdateHandler);
            }
        }
        this._updateProviderName(injectedProviderIfExists);
        const shouldPollUserAddress = true;
        const shouldUseLedgerProvider = false;
        this._startWatchingGasPrice();
        await this._resetOrInitializeAsync(this.networkId, shouldPollUserAddress, shouldUseLedgerProvider);
    }
    private _startWatchingGasPrice(): void {
        if (this._watchGasPriceIntervalId !== undefined) {
            return; // we are already watching
        }
        const oneMinuteInMs = 60000;
        // tslint:disable-next-line:no-floating-promises
        this._updateDefaultGasPriceAsync();
        this._watchGasPriceIntervalId = intervalUtils.setAsyncExcludingInterval(
            this._updateDefaultGasPriceAsync.bind(this),
            oneMinuteInMs,
            (err: Error) => {
                logUtils.log(`Watching gas price failed: ${err.stack}`);
                this._stopWatchingGasPrice();
            },
        );
    }
    private _stopWatchingGasPrice(): void {
        if (this._watchGasPriceIntervalId !== undefined) {
            intervalUtils.clearAsyncExcludingInterval(this._watchGasPriceIntervalId);
        }
    }
    private async _resetOrInitializeAsync(
        networkId: number,
        shouldPollUserAddress: boolean = false,
        shouldUserLedgerProvider: boolean = false,
    ): Promise<void> {
        if (!shouldUserLedgerProvider) {
            this._dispatcher.updateBlockchainIsLoaded(false);
        }
        this._dispatcher.updateUserWeiBalance(undefined);
        this.networkId = networkId;
        const injectedProviderIfExists = await this._getInjectedProviderIfExistsAsync();
        const [provider, ledgerSubproviderIfExists] = await Blockchain._getProviderAsync(
            injectedProviderIfExists,
            networkId,
            shouldUserLedgerProvider,
        );
        this._web3Wrapper = new Web3Wrapper(provider);
        this.networkId = await this._web3Wrapper.getNetworkIdAsync();
        if (this._contractWrappers !== undefined) {
            this._contractWrappers.unsubscribeAll();
        }
        const contractWrappersConfig = {
            networkId,
        };
        this._contractWrappers = new ContractWrappers(provider, contractWrappersConfig);
        if (this._blockchainWatcher !== undefined) {
            this._blockchainWatcher.destroy();
        }
        this._blockchainWatcher = new BlockchainWatcher(this._dispatcher, this._web3Wrapper, shouldPollUserAddress);
        if (shouldUserLedgerProvider && ledgerSubproviderIfExists !== undefined) {
            delete this._userAddressIfExists;
            this._ledgerSubprovider = ledgerSubproviderIfExists;
            this._dispatcher.updateUserAddress(undefined);
            this._dispatcher.updateProviderType(ProviderType.Ledger);
        } else {
            delete this._ledgerSubprovider;
            const userAddresses = await this._web3Wrapper.getAvailableAddressesAsync();
            this._userAddressIfExists = userAddresses[0];
            this._dispatcher.updateUserAddress(this._userAddressIfExists);
            if (injectedProviderIfExists !== undefined) {
                this._dispatcher.updateProviderType(ProviderType.Injected);
            }
            await this.fetchTokenInformationAsync();
        }
        await this._blockchainWatcher.startEmittingUserBalanceStateAsync();
        this._dispatcher.updateNetworkId(networkId);
        await this._rehydrateStoreWithContractEventsAsync();
    }
    private _updateProviderName(injectedProviderIfExists?: InjectedProvider): void {
        const doesInjectedProviderExist = injectedProviderIfExists !== undefined;
        const providerName = doesInjectedProviderExist
            ? Blockchain._getNameGivenProvider(injectedProviderIfExists)
            : constants.PROVIDER_NAME_PUBLIC;
        this._dispatcher.updateInjectedProviderName(providerName);
    }
    private async _instantiateContractIfExistsAsync(artifact: any, address?: string): Promise<ContractInstance> {
        const c = await contract(artifact);
        const providerObj = this._web3Wrapper.getProvider();
        c.setProvider(providerObj);

        const artifactNetworkConfigs = artifact.networks[this.networkId];
        let contractAddress;
        if (address !== undefined) {
            contractAddress = address;
        } else if (artifactNetworkConfigs !== undefined) {
            contractAddress = artifactNetworkConfigs.address;
        }

        if (contractAddress !== undefined) {
            const doesContractExist = await this.doesContractExistAtAddressAsync(contractAddress);
            if (!doesContractExist) {
                logUtils.log(`Contract does not exist: ${artifact.contract_name} at ${contractAddress}`);
                throw new Error(BlockchainCallErrs.ContractDoesNotExist);
            }
        }

        try {
            const contractInstance = address === undefined ? await c.deployed() : await c.at(address);
            return contractInstance;
        } catch (err) {
            const errMsg = `${err}`;
            logUtils.log(`Notice: Error encountered: ${err} ${err.stack}`);
            if (_.includes(errMsg, 'not been deployed to detected network')) {
                throw new Error(BlockchainCallErrs.ContractDoesNotExist);
            } else {
                errorReporter.report(err);
                throw new Error(BlockchainCallErrs.UnhandledError);
            }
        }
    }
    private _showFlashMessageIfLedger(): void {
        if (this._ledgerSubprovider !== undefined) {
            this._dispatcher.showFlashMessage('Confirm the transaction on your Ledger Nano S');
        }
    }
    private async _updateDefaultGasPriceAsync(): Promise<void> {
        try {
            const gasInfo = await backendClient.getGasInfoAsync();
            const gasPriceInGwei = new BigNumber(gasInfo.fast / 10);
            const gasPriceInWei = gasPriceInGwei.multipliedBy(1000000000);
            this._defaultGasPrice = gasPriceInWei;
        } catch (err) {
            return;
        }
    }
} // tslint:disable:max-file-line-count
