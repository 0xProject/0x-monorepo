import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { ContractWrappers, ERC20TokenContract } from '@0x/contract-wrappers';
import {
    ledgerEthereumBrowserClientFactoryAsync,
    LedgerSubprovider,
    MetamaskSubprovider,
    RedundantSubprovider,
    RPCSubprovider,
    SignerSubprovider,
    Web3ProviderEngine,
} from '@0x/subproviders';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import '@reach/dialog/styles.css';
import { ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';
import { AddressTable } from 'ts/pages/governance/address_table';
import { DerivationPathInput } from 'ts/pages/governance/derivation_path_input';
import { colors } from 'ts/style/colors';
import { InjectedProvider, Providers } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

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
    providerEngine?: ZeroExProvider;
    ledgerSubproviderIfExists?: LedgerSubprovider;
    isLedger?: boolean;
    web3Wrapper?: Web3Wrapper;
}

interface Props {
    onDismiss?: () => void;
    onWalletConnected?: (props: WalletConnectedProps) => void;
    onVoted?: () => void;
    onError?: (errorMessage: string) => void;
    web3Wrapper?: Web3Wrapper;
    currentBalance: BigNumber;
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

const ZERO = new BigNumber(0);

export class ConnectForm extends React.Component<Props, State> {
    public static defaultProps = {
        currentBalance: ZERO,
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
    private _providerEngine?: ZeroExProvider;
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
            derivationPath:
                derivationPathIfExists === undefined ? configs.DEFAULT_DERIVATION_PATH : derivationPathIfExists,
            derivationErrMsg: '',
        };
    }
    public render(): React.ReactNode {
        const { errors } = this.state;
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
        return (
            <div style={{ maxWidth: '470px', margin: '0 auto' }}>
                <Heading color={colors.textDarkPrimary} size={34} asElement="h2">
                    Connect Your Wallet
                </Heading>
                <Paragraph isMuted={true} color={colors.textDarkPrimary}>
                    In order to vote on this issue you will need to connect a wallet with a balance of ZRX tokens.
                </Paragraph>
                <ButtonRow>
                    <ButtonHalf onClick={this._onConnectWalletClickAsync.bind(this)}>Connect Wallet</ButtonHalf>
                    <ButtonHalf onClick={this._onConnectLedgerClickAsync.bind(this)}>Connect Ledger</ButtonHalf>
                </ButtonRow>
                {errors.connectionError !== undefined && (
                    <Paragraph isMuted={true} color={colors.red}>
                        {errors.connectionError}
                    </Paragraph>
                )}
            </div>
        );
    }
    public _renderChooseAddressContent(errors: ErrorProps): React.ReactNode {
        const { userAddresses, addressBalances, derivationPath } = this.state;
        return (
            <>
                <Heading color={colors.textDarkPrimary} size={34} asElement="h2">
                    Choose Address to Vote From
                </Heading>
                <AddressTable
                    userAddresses={userAddresses}
                    addressBalances={addressBalances}
                    networkId={this.networkId}
                    onSelectAddress={this._onSelectAddressIndex.bind(this)}
                />
                {errors.connectionError !== undefined && <ErrorParagraph>{errors.connectionError}</ErrorParagraph>}
                <DerivationPathInput
                    path={derivationPath}
                    onChangePath={this._onChangeDerivationPathAsync.bind(this)}
                />
                <ButtonRow>
                    <Button type="button" onClick={this._onGoBack.bind(this, ConnectSteps.Connect)}>
                        Back
                    </Button>
                    <Button type="button" onClick={this._onSelectedLedgerAddressAsync.bind(this)}>
                        Next
                    </Button>
                </ButtonRow>
            </>
        );
    }
    public async _onChangeDerivationPathAsync(path: string): Promise<void> {
        this.setState(
            {
                derivationPath: path,
            },
            async () => {
                await this._onFetchAddressesForDerivationPathAsync();
            },
        );
    }
    public async getUserAccountsAsync(): Promise<string[]> {
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');
        const provider = this._contractWrappers.getProvider();
        const web3Wrapper = new Web3Wrapper(provider);
        const userAccountsIfExists = await web3Wrapper.getAvailableAddressesAsync();
        return userAccountsIfExists;
    }
    public getLedgerDerivationPathIfExists(): string | undefined {
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
    public async getZrxBalanceAsync(owner: string): Promise<BigNumber> {
        utils.assert(this._contractWrappers !== undefined, 'ContractWrappers must be instantiated.');
        const contractAddresses = getContractAddressesForNetworkOrThrow(this.networkId);
        const tokenAddress: string = contractAddresses.zrxToken;
        const erc20Token = new ERC20TokenContract(tokenAddress, this._contractWrappers.getProvider());
        try {
            const amount = await erc20Token.balanceOf.callAsync(owner);
            return amount;
        } catch (error) {
            return ZERO;
        }
    }
    private async _onConnectWalletClickAsync(): Promise<boolean> {
        const shouldUseLedgerProvider = false;
        const networkIdIfExists = await this._getInjectedProviderNetworkIdIfExistsAsync();
        this.networkId = networkIdIfExists !== undefined ? networkIdIfExists : constants.NETWORK_ID_MAINNET;

        await this._resetOrInitializeAsync(this.networkId, shouldUseLedgerProvider);

        const didSucceed = await this._fetchAddressesAndBalancesAsync();
        if (didSucceed) {
            this.setState(
                {
                    errors: {},
                    preferredNetworkId: this.networkId,
                },
                async () => {
                    // Always assume selected index is 0 for Metamask
                    await this._updateSelectedAddressAsync(0);
                },
            );
        }

        return didSucceed;
    }
    private async _onConnectLedgerClickAsync(): Promise<boolean> {
        const isU2FSupported = await utils.isU2FSupportedAsync();
        if (!isU2FSupported) {
            const errorMessage = 'U2F not supported by this browser. Try using Chrome.';
            this.props.onError
                ? this.props.onError(errorMessage)
                : this.setState({
                      errors: {
                          connectionError: errorMessage,
                      },
                  });

            return false;
        }

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
    private async _onSelectedLedgerAddressAsync(): Promise<void> {
        await this._updateSelectedAddressAsync(this.state.selectedUserAddressIndex);
    }
    private async _onFetchAddressesForDerivationPathAsync(): Promise<boolean> {
        const currentlySetPath = this.getLedgerDerivationPathIfExists();
        let didSucceed;

        if (currentlySetPath === this.state.derivationPath) {
            didSucceed = true;
            return didSucceed;
        }
        this.updateLedgerDerivationPathIfExists(this.state.derivationPath);
        didSucceed = await this._fetchAddressesAndBalancesAsync();
        if (!didSucceed) {
            const errorMessage = 'Failed to connect to Ledger.';
            this.props.onError
                ? this.props.onError(errorMessage)
                : this.setState({
                      errors: {
                          connectionError: errorMessage,
                      },
                  });
        }
        return didSucceed;
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
            const errorMessage = 'Failed to connect. Follow the instructions and try again.';
            this.props.onError
                ? this.props.onError(errorMessage)
                : this.setState({
                      errors: {
                          connectionError: errorMessage,
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
        if (this.props.onWalletConnected && userAddresses[index] !== undefined) {
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
        const shouldUserLedgerProvider = true;
        await this._resetOrInitializeAsync(networkId, shouldUserLedgerProvider);
    }
    private _getNameGivenProvider(provider: ZeroExProvider): string {
        const providerType = utils.getProviderType(provider);
        const providerNameIfExists = providerToName[providerType];
        if (providerNameIfExists === undefined) {
            return constants.PROVIDER_NAME_GENERIC;
        }
        return providerNameIfExists;
    }
    private async _getProviderAsync(
        injectedProviderIfExists?: InjectedProvider,
        networkIdIfExists?: number,
        shouldUserLedgerProvider: boolean = false,
    ): Promise<[ZeroExProvider, LedgerSubprovider | undefined]> {
        // This code is based off of the Blockchain.ts code.
        // TODO refactor to re-use this utility outside of Blockchain.ts
        const doesInjectedProviderExist = injectedProviderIfExists !== undefined;
        const isNetworkIdAvailable = networkIdIfExists !== undefined;
        const publicNodeUrlsIfExistsForNetworkId = configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists];
        const isPublicNodeAvailableForNetworkId = publicNodeUrlsIfExistsForNetworkId !== undefined;
        const provider = new Web3ProviderEngine();
        const rpcSubproviders = _.map(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists], publicNodeUrl => {
            return new RPCSubprovider(publicNodeUrl);
        });

        if (shouldUserLedgerProvider && isNetworkIdAvailable) {
            const isU2FSupported = await utils.isU2FSupportedAsync();
            if (!isU2FSupported) {
                throw new Error('Cannot update providerType to LEDGER without U2F support');
            }
            const ledgerWalletConfigs = {
                networkId: networkIdIfExists,
                ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
            };
            const ledgerSubprovider = new LedgerSubprovider(ledgerWalletConfigs);
            provider.addProvider(ledgerSubprovider);
            provider.addProvider(new RedundantSubprovider(rpcSubproviders));
            provider.start();
            return [provider, ledgerSubprovider];
        } else if (doesInjectedProviderExist && isPublicNodeAvailableForNetworkId) {
            // We catch all requests involving a users account and send it to the injectedWeb3
            // instance. All other requests go to the public hosted node.
            const providerName = this._getNameGivenProvider(injectedProviderIfExists);
            // Wrap Metamask in a compatability wrapper MetamaskSubprovider (to handle inconsistencies)
            const signerSubprovider =
                providerName === constants.PROVIDER_NAME_METAMASK || constants.PROVIDER_NAME_COINBASE_WALLET
                    ? new MetamaskSubprovider(injectedProviderIfExists)
                    : new SignerSubprovider(injectedProviderIfExists);
            provider.addProvider(signerSubprovider);
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
            const networkId = constants.NETWORK_ID_MAINNET;
            const defaultRpcSubproviders = _.map(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkId], publicNodeUrl => {
                return new RPCSubprovider(publicNodeUrl);
            });
            provider.addProvider(new RedundantSubprovider(defaultRpcSubproviders));
            provider.start();
            return [provider, undefined];
        }
    }
    private async _getInjectedProviderIfExistsAsync(): Promise<InjectedProvider | undefined> {
        if (this._injectedProviderIfExists !== undefined) {
            return this._injectedProviderIfExists;
        }
        let injectedProviderIfExists = (window as any).ethereum;
        if (injectedProviderIfExists !== undefined) {
            if (injectedProviderIfExists.enable !== undefined) {
                await injectedProviderIfExists.enable();
            }
        } else {
            const injectedWeb3IfExists = (window as any).web3;
            if (injectedWeb3IfExists !== undefined && injectedWeb3IfExists.currentProvider !== undefined) {
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
    private async _resetOrInitializeAsync(networkId: number, shouldUserLedgerProvider: boolean = false): Promise<void> {
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
        if (this._contractWrappers !== undefined) {
            this._contractWrappers.unsubscribeAll();
        }
        const contractWrappersConfig = {
            networkId,
        };
        this._contractWrappers = new ContractWrappers(provider, contractWrappersConfig);
        if (shouldUserLedgerProvider && ledgerSubproviderIfExists !== undefined) {
            delete this._userAddressIfExists;
            this._ledgerSubprovider = ledgerSubproviderIfExists;
        } else {
            delete this._ledgerSubprovider;
            const userAddresses = await this._web3Wrapper.getAvailableAddressesAsync();
            this._userAddressIfExists = userAddresses[0];
        }
    }
    private async _getUserAddressesAsync(): Promise<string[]> {
        let userAddresses: string[];
        userAddresses = await this.getUserAccountsAsync();

        if (_.isEmpty(userAddresses)) {
            throw new Error('No addresses retrieved.');
        }
        return userAddresses;
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

const ButtonHalf = styled(Button)`
    width: calc(50% - 15px);
    padding: 18px 18px;
`;
// tslint:disable:max-file-line-count

const ErrorParagraph = styled(Paragraph).attrs({
    color: colors.red,
    isMuted: true,
})`
    margin: 10px 0 0 30px;
`;
