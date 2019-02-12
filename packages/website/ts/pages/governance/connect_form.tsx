import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { DialogContent, DialogOverlay } from '@reach/dialog';
import '@reach/dialog/styles.css';

// import { LedgerSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { ContractWrappers } from '@0x/contract-wrappers';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { Button } from 'ts/components/button';
import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';
import { utils } from 'ts/utils/utils';

import { AddressTable } from 'ts/pages/governance/address_table';

import {
    ledgerEthereumBrowserClientFactoryAsync,
    LedgerSubprovider,
    MetamaskSubprovider,
    RedundantSubprovider,
    RPCSubprovider,
    SignerSubprovider,
    Web3ProviderEngine,
} from '@0x/subproviders';
import { Provider } from 'ethereum-types';
import { InjectedProvider, Providers } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import FilterSubprovider from 'web3-provider-engine/subproviders/filters';

const providerToName: { [provider: string]: string } = {
    [Providers.Metamask]: constants.PROVIDER_NAME_METAMASK,
    [Providers.Parity]: constants.PROVIDER_NAME_PARITY_SIGNER,
    [Providers.Mist]: constants.PROVIDER_NAME_MIST,
    [Providers.CoinbaseWallet]: constants.PROVIDER_NAME_COINBASE_WALLET,
    [Providers.Cipher]: constants.PROVIDER_NAME_CIPHER,
};

export interface WalletConnectedProps {
    providerName: string;
    selectedAddress: string;
    currentBalance: BigNumber;
    contractWrappers?: ContractWrappers;
    injectedProviderIfExists?: InjectedProvider;
    providerEngine?: Provider;
    ledgerSubproviderIfExists?: LedgerSubprovider;
    isLedger?: boolean;
    web3Wrapper?: Web3Wrapper;
}

interface Props {
    onDismiss?: () => void;
    onWalletConnected?: (props: WalletConnectedProps) => void;
    onVoted?: () => void;
    web3Wrapper?: Web3Wrapper;
    currentBalance: string;
    web3?: any;
}

interface State {
    providerName?: string;
    connectionErrMsg: string;
    isWalletConnected: boolean;
    isLedgerConnected: boolean;
    isSubmitting: boolean;
    isSuccessful: boolean;
    preferredNetworkId: number;
    selectedUserAddressIndex: number;
    errors: ErrorProps;
    web3?: any;
    userAddresses: string[];
    addressBalances: BigNumber[];
    derivationPath: string;
    derivationErrMsg: string;
}

interface ErrorProps {
    [key: string]: string;
}

enum ConnectSteps {
    Connect,
    SelectAddress,
}

export class ConnectForm extends React.Component<Props, State> {
    public static defaultProps = {
        currentBalance: '0.00',
        isWalletConnected: false,
        errors: {},
    };
    // blockchain related
    public networkId: number;
    private _providerName: string;
    private _userAddressIfExists: string;
    private _contractWrappers: ContractWrappers;
    private _injectedProviderIfExists?: InjectedProvider;
    private _web3Wrapper?: Web3Wrapper;
    private _providerEngine?: Provider;
    private _ledgerSubprovider: LedgerSubprovider;
    public constructor(props: Props) {
        super(props);
        const derivationPathIfExists = this.getLedgerDerivationPathIfExists();
        this.state = {
            connectionErrMsg: '',
            isWalletConnected: false,
            isLedgerConnected: false,
            isSubmitting: false,
            isSuccessful: false,
            providerName: null,
            preferredNetworkId: constants.NETWORK_ID_MAINNET,
            selectedUserAddressIndex: 0,
            errors: {},
            userAddresses: [],
            addressBalances: [],
            derivationPath: _.isUndefined(derivationPathIfExists)
                ? configs.DEFAULT_DERIVATION_PATH
                : derivationPathIfExists,
            derivationErrMsg: '',
        };
    }
    public render(): React.ReactNode {
        const { errors } = this.state;
        const { currentBalance } = this.props;
        return (
            <div style={{ textAlign: 'center' }}>
                <Icon name="wallet" size={120} margin={[0, 0, 'default', 0]} />
                {this._renderContent(errors)}
            </div>
        );
    }
    public _renderContent(errors: ErrorProps): React.ReactNode {
        switch (this.state.isLedgerConnected) {
            case true:
                return this._renderChooseAddressContent(errors);
            case false:
            default:
                return this._renderButtonsContent(errors);
        }
    }
    public _renderButtonsContent(errors: ErrorProps): React.ReactNode {
        // const { currentBalance, web3Wrapper } = this.state;
        return (
            <div style={{ maxWidth: '470px', margin: '0 auto' }}>
                <Heading color={colors.textDarkPrimary} size={34} asElement="h2">
                    Connect Your Wallet
                </Heading>
                <Paragraph isMuted={true} color={colors.textDarkPrimary}>
                    In order to vote on this issue you will need to connect a wallet with a balance of ZRX tokens.
                </Paragraph>
                <ButtonRow>
                    <ButtonHalf onClick={this._onConnectWalletClickAsync.bind(this)}>Connect Metamask</ButtonHalf>
                    <ButtonHalf onClick={this._onConnectLedgerClickAsync.bind(this)}>Connect Ledger</ButtonHalf>
                </ButtonRow>
                {!_.isUndefined(errors.connectionError) && (
                    <Paragraph isMuted={true} color={colors.red}>
                        {errors.connectionError}
                    </Paragraph>
                )}
            </div>
        );
    }
    public _renderChooseAddressContent(errors: ErrorProps): React.ReactNode {
        const { userAddresses, addressBalances, preferredNetworkId } = this.state;
        return (
            <>
                <Heading color={colors.textDarkPrimary} size={34} asElement="h2">
                    Choose Adress to Vote From
                </Heading>
                <AddressTable
                    userAddresses={userAddresses}
                    addressBalances={addressBalances}
                    networkId={this.networkId}
                    onSelectAddress={this._onSelectAddressIndex.bind(this)}
                />
                {!_.isUndefined(errors.connectionError) && (
                    <Paragraph isMuted={true} color={colors.red}>
                        {errors.connectionError}
                    </Paragraph>
                )}
                <ButtonRow>
                    <Button type="button" onClick={this._onGoBack.bind(this, ConnectSteps.Connect)}>
                        Back
                    </Button>
                    <Button type="button" onClick={this._onSelectedLedgerAddress.bind(this)}>
                        Next
                    </Button>
                </ButtonRow>
            </>
        );
    }
    public async getUserAccountsAsync(): Promise<string[]> {
        utils.assert(!_.isUndefined(this._contractWrappers), 'ContractWrappers must be instantiated.');
        const provider = this._contractWrappers.getProvider();
        const web3Wrapper = new Web3Wrapper(provider);
        const userAccountsIfExists = await web3Wrapper.getAvailableAddressesAsync();
        return userAccountsIfExists;
    }
    public getLedgerDerivationPathIfExists(): string {
        if (_.isUndefined(this._ledgerSubprovider)) {
            return undefined;
        }
        const path = this._ledgerSubprovider.getPath();
        return path;
    }
    public async getBalanceInWeiAsync(owner: string): Promise<BigNumber> {
        const balanceInWei = await this._web3Wrapper.getBalanceInWeiAsync(owner);
        return balanceInWei;
    }
    public async getZrxBalanceAsync(owner: string): Promise<BigNumber> {
        utils.assert(!_.isUndefined(this._contractWrappers), 'ContractWrappers must be instantiated.');
        // const injectedProvider = undefined;
        const injectedProvider = await this._getInjectedProviderIfExistsAsync();

        if (!_.isUndefined(injectedProvider)) {
            const contractAddresses = getContractAddressesForNetworkOrThrow(this.networkId);
            const tokenAddress: string = contractAddresses.zrxToken;
            try {
                const amount = await this._contractWrappers.erc20Token.getBalanceAsync(tokenAddress, owner);
                // const formattedAmount = utils.getFormattedAmount(amount, constants.DECIMAL_PLACES_ETH);

                return amount;
            } catch (error) {
                console.log(error);
                return new BigNumber(0);
            }
        }

        return new BigNumber(0);
    }
    private async _onConnectWalletClickAsync(): Promise<boolean> {
        const shouldPollUserAddress = true;
        const shouldUseLedgerProvider = false;
        const networkIdIfExists = await this._getInjectedProviderNetworkIdIfExistsAsync();
        this.networkId = !_.isUndefined(networkIdIfExists) ? networkIdIfExists : constants.NETWORK_ID_MAINNET;

        await this._resetOrInitializeAsync(this.networkId, shouldPollUserAddress, shouldUseLedgerProvider);

        const didSucceed = await this._fetchAddressesAndBalancesAsync();
        if (didSucceed) {
            await this.setState({
                errors: {},
                preferredNetworkId: this.networkId,
            });
            // Always assume selected index is 0 for Metamask
            this._updateSelectedAddressAsync(0);
        }

        return didSucceed;
    }
    private async _onConnectLedgerClickAsync(): Promise<boolean> {
        const isU2FSupported = await utils.isU2FSupportedAsync();
        if (!isU2FSupported) {
            // logUtils.log(`U2F not supported in this browser`);
            this.setState({
                errors: {
                    connectionError: 'U2F not supported by this browser. Try using Chrome.',
                },
            });
            return false;
        }

        // const networkId = this.state.preferredNetworkId;
        const shouldPollUserAddress = true;
        const shouldUserLedgerProvider = false;

        // We don't want to be out of sync with the network the injected provider declares.
        const networkId = constants.NETWORK_ID_MAINNET;
        await this._updateProviderToLedgerAsync(networkId);

        const didSucceed = await this._fetchAddressesAndBalancesAsync();
        if (didSucceed) {
            this.setState({
                errors: {},
                isLedgerConnected: true,
            });
        }
        return didSucceed;
    }
    private _onSelectAddressIndex(index: number): void {
        this.setState({
            selectedUserAddressIndex: index,
        });
    }
    private _onSelectedLedgerAddress(): void {
        this._updateSelectedAddressAsync(this.state.selectedUserAddressIndex);
    }
    private async _fetchAddressesAndBalancesAsync(): Promise<boolean> {
        let userAddresses: string[];
        const addressBalances: BigNumber[] = [];
        try {
            userAddresses = await this._getUserAddressesAsync();
            for (const address of userAddresses) {
                const balanceInZrx = await this.getZrxBalanceAsync(address);
                addressBalances.push(balanceInZrx);
            }
        } catch (err) {
            console.log(err);
            // logUtils.log(`Ledger error: ${JSON.stringify(err)}`);
            this.setState({
                errors: {
                    connectionError: 'Failed to connect. Follow the instructions and try again.',
                },
            });
            return false;
        }

        this.setState({
            userAddresses,
            addressBalances,
        });
        return true;
    }
    private async _updateSelectedAddressAsync(index: number): Promise<void> {
        const { userAddresses, addressBalances, isLedgerConnected } = this.state;
        const injectedProviderIfExists = await this._getInjectedProviderIfExistsAsync();
        if (this.props.onWalletConnected && !_.isUndefined(userAddresses[index])) {
            const walletInfo: WalletConnectedProps = {
                contractWrappers: this._contractWrappers,
                injectedProviderIfExists,
                ledgerSubproviderIfExists: this._ledgerSubprovider,
                selectedAddress: userAddresses[index],
                currentBalance: addressBalances[index],
                providerEngine: this._providerEngine,
                providerName: this._providerName,
                web3Wrapper: this._web3Wrapper,
                isLedger: isLedgerConnected,
            };
            this.props.onWalletConnected(walletInfo);
        }
    }
    private async _updateProviderToLedgerAsync(networkId: number): Promise<void> {
        const shouldPollUserAddress = false;
        const shouldUserLedgerProvider = true;
        await this._resetOrInitializeAsync(networkId, shouldPollUserAddress, shouldUserLedgerProvider);
    }
    private async _updateProviderToInjectedAsync(): Promise<void> {
        const shouldPollUserAddress = true;
        const shouldUserLedgerProvider = false;
        // this._dispatcher.updateBlockchainIsLoaded(false);
        // We don't want to be out of sync with the network the injected provider declares.
        const networkId = await this._getInjectedProviderNetworkIdIfExistsAsync();
        await this._resetOrInitializeAsync(networkId, shouldPollUserAddress, shouldUserLedgerProvider);
    }
    private _getNameGivenProvider(provider: Provider): string {
        const providerType = utils.getProviderType(provider);
        const providerNameIfExists = providerToName[providerType];
        if (_.isUndefined(providerNameIfExists)) {
            return constants.PROVIDER_NAME_GENERIC;
        }
        return providerNameIfExists;
    }
    private async _getProviderAsync(
        injectedProviderIfExists?: InjectedProvider,
        networkIdIfExists?: number,
        shouldUserLedgerProvider: boolean = false,
    ): Promise<[Provider, LedgerSubprovider | undefined]> {
        const doesInjectedProviderExist = !_.isUndefined(injectedProviderIfExists);
        const isNetworkIdAvailable = !_.isUndefined(networkIdIfExists);
        const publicNodeUrlsIfExistsForNetworkId = configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists];
        const isPublicNodeAvailableForNetworkId = !_.isUndefined(publicNodeUrlsIfExistsForNetworkId);

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
            provider.addProvider(new FilterSubprovider());
            const rpcSubproviders = _.map(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists], publicNodeUrl => {
                return new RPCSubprovider(publicNodeUrl);
            });
            provider.addProvider(new RedundantSubprovider(rpcSubproviders));
            provider.start();
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
            provider.addProvider(new FilterSubprovider());
            const rpcSubproviders = _.map(publicNodeUrlsIfExistsForNetworkId, publicNodeUrl => {
                return new RPCSubprovider(publicNodeUrl);
            });
            provider.addProvider(new RedundantSubprovider(rpcSubproviders));
            provider.start();
            return [provider, undefined];
        } else if (doesInjectedProviderExist) {
            // Since no public node for this network, all requests go to injectedWeb3 instance
            return [injectedProviderIfExists, undefined];
        } else {
            // If no injectedWeb3 instance, all requests fallback to our public hosted mainnet/testnet node
            // We do this so that users can still browse the 0x Portal DApp even if they do not have web3
            // injected into their browser.
            const provider = new Web3ProviderEngine();
            provider.addProvider(new FilterSubprovider());
            const networkId = constants.NETWORK_ID_MAINNET;
            const rpcSubproviders = _.map(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkId], publicNodeUrl => {
                return new RPCSubprovider(publicNodeUrl);
            });
            provider.addProvider(new RedundantSubprovider(rpcSubproviders));
            provider.start();
            return [provider, undefined];
        }
    }
    private async _getInjectedProviderIfExistsAsync(): Promise<InjectedProvider | undefined> {
        if (!_.isUndefined(this._injectedProviderIfExists)) {
            return this._injectedProviderIfExists;
        }
        let injectedProviderIfExists = (window as any).ethereum;
        if (!_.isUndefined(injectedProviderIfExists)) {
            if (!_.isUndefined(injectedProviderIfExists.enable)) {
                try {
                    await injectedProviderIfExists.enable();
                } catch (err) {
                    console.log(err);
                    // errorReporter.report(err);
                }
            }
        } else {
            const injectedWeb3IfExists = (window as any).web3;
            if (!_.isUndefined(injectedWeb3IfExists) && !_.isUndefined(injectedWeb3IfExists.currentProvider)) {
                injectedProviderIfExists = injectedWeb3IfExists.currentProvider;
            } else {
                return undefined;
            }
        }
        this._injectedProviderIfExists = injectedProviderIfExists;
        return injectedProviderIfExists;
    }
    private async _getInjectedProviderNetworkIdIfExistsAsync(): Promise<number | undefined> {
        // If the user has an injectedWeb3 instance that is disconnected from a backing
        // Ethereum node, this call will throw. We need to handle this case gracefully
        const injectedProviderIfExists = await this._getInjectedProviderIfExistsAsync();
        let networkIdIfExists: number;
        if (!_.isUndefined(injectedProviderIfExists)) {
            try {
                const injectedWeb3Wrapper = new Web3Wrapper(injectedProviderIfExists);
                networkIdIfExists = await injectedWeb3Wrapper.getNetworkIdAsync();
            } catch (err) {
                // Ignore error and proceed with networkId undefined
            }
        }
        return networkIdIfExists;
    }
    private async _resetOrInitializeAsync(
        networkId: number,
        shouldPollUserAddress: boolean = false,
        shouldUserLedgerProvider: boolean = false,
    ): Promise<void> {
        if (!shouldUserLedgerProvider) {
            // this._dispatcher.updateBlockchainIsLoaded(false);
        }
        // this._dispatcher.updateUserWeiBalance(undefined);
        this.networkId = networkId;
        const injectedProviderIfExists = await this._getInjectedProviderIfExistsAsync();
        const [provider, ledgerSubproviderIfExists] = await this._getProviderAsync(
            injectedProviderIfExists,
            networkId,
            shouldUserLedgerProvider,
        );
        this._web3Wrapper = new Web3Wrapper(provider);
        this._providerEngine = provider;
        this.networkId = await this._web3Wrapper.getNetworkIdAsync();
        this._providerName = this._getNameGivenProvider(provider);
        if (!_.isUndefined(this._contractWrappers)) {
            this._contractWrappers.unsubscribeAll();
        }
        const contractWrappersConfig = {
            networkId,
        };
        this._contractWrappers = new ContractWrappers(provider, contractWrappersConfig);
        if (shouldUserLedgerProvider && !_.isUndefined(ledgerSubproviderIfExists)) {
            delete this._userAddressIfExists;
            this._ledgerSubprovider = ledgerSubproviderIfExists;
        } else {
            delete this._ledgerSubprovider;
            const userAddresses = await this._web3Wrapper.getAvailableAddressesAsync();
            this._userAddressIfExists = userAddresses[0];
            // this._dispatcher.updateUserAddress(this._userAddressIfExists);
            if (!_.isUndefined(injectedProviderIfExists)) {
                // this._dispatcher.updateProviderType(ProviderType.Injected);
            }
            // await this.fetchTokenInformationAsync();
        }
    }
    private _updateProviderName(injectedProviderIfExists?: InjectedProvider): void {
        const doesInjectedProviderExist = !_.isUndefined(injectedProviderIfExists);
        const providerName = doesInjectedProviderExist
            ? this._getNameGivenProvider(injectedProviderIfExists)
            : constants.PROVIDER_NAME_PUBLIC;
        // this._dispatcher.updateInjectedProviderName(providerName);
    }
    private async _getUserAddressesAsync(): Promise<string[]> {
        let userAddresses: string[];
        userAddresses = await this.getUserAccountsAsync();

        if (_.isEmpty(userAddresses)) {
            throw new Error('No addresses retrieved.');
        }
        return userAddresses;
    }
    private _onSelectedNetworkUpdated(_event: any, _index: number, networkId: number): void {
        this.setState({
            preferredNetworkId: networkId,
        });
    }
    private _onGoBack(step: number): void {
        switch (step) {
            case ConnectSteps.SelectAddress:
                // @todo support going back to select address
                this.setState({
                    isLedgerConnected: false,
                });
                break;
            default:
            case ConnectSteps.Connect:
                this.setState({
                    isLedgerConnected: false,
                });
        }
    }
}

const InputRow = styled.div`
    width: 100%;
    flex: 0 0 auto;

    @media (min-width: 768px) {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
    }
`;

const ButtonRow = styled(InputRow)`
    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;

        button:nth-child(1) {
            order: 2;
        }

        button:nth-child(2) {
            order: 1;
            margin-bottom: 10px;
        }
    }
`;

const ButtonFull = styled(Button)`
    width: 100%;
`;

const ButtonHalf = styled(Button)`
    width: calc(50% - 15px);
    padding: 18px 18px;
`;
// tslint:disable:max-file-line-count
