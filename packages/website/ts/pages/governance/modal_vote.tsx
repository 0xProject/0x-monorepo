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
import {
    BigNumber,
    signTypedDataUtils,
 } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { Button } from 'ts/components/button';
import { Icon } from 'ts/components/icon';
import { Input, InputWidth } from 'ts/components/modals/input';
import { Heading, Paragraph } from 'ts/components/text';
import { GlobalStyle } from 'ts/constants/globalStyle';
import { utils } from 'ts/utils/utils';
import { FormEvent } from 'react';

import {
    signatureUtils,
} from '0x.js';
import * as ethUtil from 'ethereumjs-util';

import {
    ECSignature,
} from '@0x/types';

import {
    ledgerEthereumBrowserClientFactoryAsync,
    LedgerSubprovider,
    MetamaskSubprovider,
    RedundantSubprovider,
    RPCSubprovider,
    SignerSubprovider,
    Web3ProviderEngine,
} from '@0x/subproviders';
import { BlockParam, LogWithDecodedArgs, Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import {
    BlockchainCallErrs,
    BlockchainErrs,
    ContractInstance,
    Fill,
    InjectedProvider,
    InjectedProviderObservable,
    InjectedProviderUpdate,
    JSONRPCPayload,
    Providers,
    ProviderType,
    Side,
    SideToAssetToken,
    Token,
    TokenByAddress,
} from 'ts/types';
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

export enum ModalContactType {
    General = 'GENERAL',
    MarketMaker = 'MARKET_MAKER',
}

export enum VoteValue {
    Yes = 'Yes',
    No = 'No',
}

interface Props {
    theme?: GlobalStyle;
    isOpen?: boolean;
    onDismiss?: () => void;
    onWalletConnected?: (providerName: string) => void;
    onVoted?: () => void;
    modalContactType: ModalContactType;
}

interface State {
    currentBalance: string;
    isWalletConnected: boolean;
    providerName: string;
    isSubmitting: boolean;
    isSuccessful: boolean;
    isVoted: boolean;
    votePreference: string | null;
    errors: ErrorProps;
}

interface FormProps {
    isSuccessful?: boolean;
    isSubmitting?: boolean;
}

interface ErrorResponseProps {
    param: string;
    location: string;
    msg: string;
}

interface ErrorResponse {
    errors: ErrorResponseProps[];
}

interface ErrorProps {
    [key: string]: string;
}

export enum SignatureType {
    Illegal, // unused 0
    Invalid, // unused 1
    EIP712, // 2
    EthSign, // 3
    Wallet, // unused 4
    Validator, // unused 5
    PreSigned, // unused 6
    NSignatureTypes, // unused 7
}

export class ModalVote extends React.Component<Props> {
    public static defaultProps = {
        modalContactType: ModalContactType.General,
    };
    public networkId: number;
    public state: State = {
        currentBalance: '0.00',
        isWalletConnected: false,
        providerName: 'Metamask',
        isSubmitting: false,
        isSuccessful: false,
        isVoted: false,
        votePreference: null,
        errors: {},
    };
    // shared fields
    public nameRef: React.RefObject<HTMLInputElement> = React.createRef();
    public emailRef: React.RefObject<HTMLInputElement> = React.createRef();
    public companyProjectRef: React.RefObject<HTMLInputElement> = React.createRef();
    public commentsRef: React.RefObject<HTMLInputElement> = React.createRef();
    // general lead fields
    public linkRef: React.RefObject<HTMLInputElement> = React.createRef();
    // market maker lead fields
    public countryRef: React.RefObject<HTMLInputElement> = React.createRef();
    public fundSizeRef: React.RefObject<HTMLInputElement> = React.createRef();
    // blockchain related
    private _injectedProviderIfExists?: InjectedProvider;
    private _web3Wrapper?: Web3Wrapper;
    public constructor(props: Props) {
        super(props);
    }
    public render(): React.ReactNode {
        const { isOpen, onDismiss } = this.props;
        const { isSuccessful, errors, votePreference } = this.state;
        return (
            <>
                <DialogOverlay
                    style={{ background: 'rgba(0, 0, 0, 0.75)', zIndex: 30 }}
                    isOpen={isOpen}
                    onDismiss={onDismiss}
                >
                    <StyledDialogContent>
                        <Form onSubmit={this._onSubmitAsync.bind(this)} isSuccessful={isSuccessful}>
                            {this._renderFormContent(errors)}
                            <ButtonRow>
                                <Button
                                    color="#5C5C5C"
                                    isNoBorder={true}
                                    isTransparent={true}
                                    type="button"
                                    onClick={this.props.onDismiss}
                                >
                                    Back
                                </Button>
                                {this.state.isWalletConnected && <ButtonDisabled disabled={!votePreference}>Submit</ButtonDisabled>}
                            </ButtonRow>
                        </Form>
                        <Confirmation isSuccessful={isSuccessful}>
                            <Icon name="rocketship" size="large" margin={[0, 0, 'default', 0]} />
                            <Heading color={colors.textDarkPrimary} size={34} asElement="h2">
                                Vote Received
                            </Heading>
                            <Paragraph isMuted={true} color={colors.textDarkPrimary}>
                                Your vote will help to decide the future of the protocol. You will be receiving a custom “I voted” NFT as a token of our appreciation.
                            </Paragraph>
                            <Button onClick={this.props.onDismiss}>Done</Button>
                            <Button onClick={this.props.onDismiss} isTransparent={true}>Connect a different wallet</Button>
                        </Confirmation>
                    </StyledDialogContent>
                </DialogOverlay>
            </>
        );
    }
    public _renderFormContent(errors: ErrorProps): React.ReactNode {
        switch (this.state.isWalletConnected) {
            case true:
                return this._renderVoteFormContent(errors);
            case false:
            default:
                return this._renderConnectWalletFormContent(errors);
        }
    }
    private _renderConnectWalletFormContent(errors: ErrorProps): React.ReactNode {
        return (
            <>
                <Heading color={colors.textDarkPrimary} size={34} asElement="h2">
                    Connect your Wallet
                </Heading>
                <Paragraph isMuted={true} color={colors.textDarkPrimary}>
                    In order to vote on this issue you will need to connect a wallet with a balance of ZRX tokens.
                </Paragraph>
                <ButtonRow>
                    <ButtonFull onClick={this._onConnectSimpleAsync.bind(this)}>Connect Metamask</ButtonFull>
                </ButtonRow>
                {_.isUndefined(errors.walletError) && (
                    <Paragraph isMuted={true} color={colors.red}>
                        {errors.walletError}
                    </Paragraph>
                )}
            </>
        );
    }
    private _renderVoteFormContent(errors: ErrorProps): React.ReactNode {
        const { currentBalance, votePreference } = this.state;
        return (
            <>
                <Heading color={colors.textDarkPrimary} size={34} asElement="h2">
                    MultiAssetProxy Vote
                </Heading>
                <Paragraph isMuted={true} color={colors.textDarkPrimary}>
                    Make sure you are informed to the best of your ability before casting your vote. It will have lasting implications for the 0x ecosystem.
                </Paragraph>
                <Paragraph isMuted={true} color={colors.textDarkPrimary}>
                    <strong>Voting balance:</strong> {currentBalance} ZRX
                </Paragraph>
                <ButtonRow>
                    <ButtonActive isActive={votePreference === VoteValue.Yes} activeColor={colors.brandLight} onClick={this._setVoteYesPreference.bind(this)}>Yes (Accept)</ButtonActive>
                    <ButtonActive isActive={votePreference === VoteValue.No} activeColor="#CF4B00" onClick={this._setVoteNoPreference.bind(this)}>No (Reject)</ButtonActive>
                </ButtonRow>
                <InputRow>
                    <Input
                        name="comments"
                        label="Add a comment (Optional)"
                        type="textarea"
                        ref={this.commentsRef}
                        errors={errors}
                    />
                </InputRow>
            </>
        );
    }
    private async _onConnectAsync(e: Event): Promise<void> {
        e.preventDefault();

        const shouldUserLedgerProvider = true;
        const networkId = 1;
        try {
            const injectedProviderIfExists = await this._getInjectedProviderIfExistsAsync();
            const [provider, ledgerSubproviderIfExists] = await this._getProviderAsync(
                injectedProviderIfExists,
                networkId,
                shouldUserLedgerProvider,
            );
            this._web3Wrapper = new Web3Wrapper(provider);
            this.networkId = await this._web3Wrapper.getNetworkIdAsync();
            // debugger;

            const providerEngine = new Web3ProviderEngine();
            // const ledgerProvider = new LedgerSubprovider();
            const web3Wrapper = new Web3Wrapper(providerEngine);
            const accounts = await web3Wrapper.getAvailableAddressesAsync();

            console.log(accounts);
        } catch (error) {
            console.log(error);
        }

        /*
        if (window.ethereum) {
            window.web3 = new Web3(ethereum);

            try {
                // Request account access if needed
                await ethereum.enable();

                this.setState({ ...this.state, isWalletConnected: true });

                if (this.props.onWalletConnected) {
                    this.props.onWalletConnected();
                }
            } catch (error) {
                // User denied account access...
                console.log(error);
            }
        }*/
    }
    private async _onConnectSimpleAsync(e: Event): Promise<void> {
        e.preventDefault();
        // const injectedProvider = undefined;
        const injectedProvider = await this._getInjectedProviderIfExistsAsync();

        if (!_.isUndefined(injectedProvider)) {
            const providerName = this._getNameGivenProvider(injectedProvider);
            const injectedWeb3IfExists = (window as any).web3;
            const balance = await this._getZrxBalanceAsync(injectedWeb3IfExists.eth.defaultAccount);

            this.setState({ ...this.state, isWalletConnected: true, providerName, currentAddress: injectedProvider, currentBalance: balance });

            if (this.props.onWalletConnected) {
                this.props.onWalletConnected(providerName);
            }
        } else {
            this.setState({ ...this.state, isWalletConnected: false, errors: { walletError: 'Could not connected wallet or Ledger.' }});
        }
    }
    private async _getZrxBalanceAsync(walletAddress: string): Promise<string> {
        // const injectedProvider = undefined;
        const injectedProvider = await this._getInjectedProviderIfExistsAsync();

        if (!_.isUndefined(injectedProvider)) {
            // NETWORK_CONFIGS.networkId
            const contractAddresses = getContractAddressesForNetworkOrThrow(3);
            const tokenAddress: string = contractAddresses.zrxToken;

            // Get ERC20 Token contract instance
            const injectedWeb3IfExists = (window as any).web3;
            const contractWrapper = new ContractWrappers(injectedProvider, { networkId: 3 });

            try {
                const amount = await contractWrapper.erc20Token.getBalanceAsync(tokenAddress, walletAddress);
                const formattedAmount = utils.getFormattedAmount(amount, constants.DECIMAL_PLACES_ETH);

                return formattedAmount;
            } catch (error) {
                return utils.getFormattedAmount(new BigNumber(0), constants.DECIMAL_PLACES_ETH);
            }
        }

        return utils.getFormattedAmount(new BigNumber(0), constants.DECIMAL_PLACES_ETH);
    }
    private async _voteNewAsync(e: FormEvent): Promise<string> {
        const domain = [
            { name: 'name', type: 'string' },
        ];
        const vote = [
            { name: 'preference', type: 'string' },
            { name: 'zeip', type: 'uint256' },
            { name: 'title', type: 'string' },
        ];
        const domainData = {
            name: '0x Protocol Governance',
        };
        const message = {
            preference: 'Yes',
            zeip: '23',
            title: 'MultiAssetProxy: Allow multiple assets per side of a single order',
        };
        const types = {
                EIP712Domain: domain,
                Vote: vote,
        };
        const typedData = {
            types: {
                EIP712Domain: domain,
                Vote: vote,
            },
            domain: domainData,
            message,
            primaryType: 'Vote',
        };

        const voteHashBuffer = signTypedDataUtils.generateTypedDataHash(typedData);
        // console.log(`0x${voteHashBuffer.toString('hex')}`);
        // 0x4afb05e4654fa3daed96183f581b4e9637e3ebe1da182a99f7a2cf48b51a129a

        // Instantiate wrapper
        const injectedWeb3IfExists = (window as any).web3;
        const providerEngine = new Web3ProviderEngine();
        // Compose our Providers, order matters
        // Use the SignerSubprovider to wrap the browser extension wallet
        // All account based and signing requests will go through the SignerSubprovider
        providerEngine.addProvider(new SignerSubprovider(injectedWeb3IfExists.currentProvider));
        // Use an RPC provider to route all other requests
        // providerEngine.addProvider(new RPCSubprovider('http://localhost:8545'));
        providerEngine.start();

        const web3Wrapper = new Web3Wrapper(providerEngine);

        // Sign voteHashBuffer
        // const injectedWeb3IfExists = (window as any).web3;
        const signerAddress = injectedWeb3IfExists.eth.coinbase;

        debugger;
        const signature = await web3Wrapper.signTypedDataAsync(signerAddress, typedData);

        const ecSignatureRSV = this._parseSignatureHexAsRSV(signature); // can be found in signature utils but not exported
        const signatureBuffer = Buffer.concat([
            ethUtil.toBuffer(ecSignatureRSV.v),
            ethUtil.toBuffer(ecSignatureRSV.r),
            ethUtil.toBuffer(ecSignatureRSV.s),
            ethUtil.toBuffer(SignatureType.EIP712), // append the signature type byte
        ]);
        const signatureHex = `0x${signatureBuffer.toString('hex')}`;

        console.log(signatureHex);

        const isValid = await signatureUtils.isValidSignatureAsync(injectedWeb3IfExists.currentProvider, signatureHex, signature, signerAddress);

        debugger;
        console.log(signatureHex, isValid);

        return signatureHex;

    }
    /*private async _voteAsync(e: FormEvent): Promise<string> {
        const { votePreference } = this.state;
        const domainType = [
            {
                name: 'name',
                type: 'string',
            },
            {
                name: 'version',
                type: 'string',
            },
        ];
        const voteType = [
            {
                name: 'campaignId',
                type: 'uint256',
            },
            {
                name: 'preference',
                type: 'string',
            },
        ];

        const domainData = {
            name: '0x V0x',
            version: '1',
        };
        const voteData = {
            campaignId: '1',
            preference: votePreference,
        };

        const zdata = JSON.stringify({
            types: {
                EIP712Domain: domainType,
                Vote: voteType,
            },
            domain: domainData,
            primaryType: 'Vote',
            message: voteData,
        });

        const injectedProvider = await this._getInjectedProviderIfExistsAsync();
        const zrxContractAddress = '0xE41d2489571d322189246DaFA5ebDe1F4699F498';
        const injectedWeb3IfExists = (window as any).web3;
        const signer = injectedWeb3IfExists.eth.coinbase;
        console.log(zdata, signer, votePreference);

        const payload: JSONRPCPayload = {
            method: 'eth_signTypedData_v3',
            params: [
                signer, zdata,
            ],
            // from: signer,
        };

        return new Promise(function (resolve, reject) {
            function done(error: string, result: string) {
                if (error) {
                    //this.setState({ ...this.state, isSuccessful: true });

                    console.error(error);
                    reject(error);
                } else {
                    console.log(result);
                    resolve(result.result);
                }
            }
            // injectedProvider
            injectedProvider
                .sendAsync(payload, done);
        });
    }*/
    private async _onSubmitAsync(e: FormEvent): Promise<void> {
        e.preventDefault();

        if (!this.state.votePreference) {
            return;
        }

        try {
            // const signature = this._voteAsync(e);
            const signature = await this._voteNewAsync(e);

            this.setState({ ...this.state, isSuccessful: true });

            if (this.props.onVoted) {
                this.props.onVoted();
            }

            const injectedWeb3IfExists = (window as any).web3;
            const jsonBody = JSON.stringify({
                preference: this.state.votePreference,
                voterAddress: injectedWeb3IfExists.eth.coinbase,
                signature,
                comment: this.commentsRef.current.value,
                campaignId: 1,
            });
            console.log(jsonBody);
        } catch (error) {
            console.log('Error', error);
        }

        return;

        this.setState({ ...this.state, errors: [], isSubmitting: true });

        const endpoint = '';
        const jsonBody = {};

        try {
            // Disabling no-unbound method b/c no reason for _.isEmpty to be bound
            // tslint:disable:no-unbound-method
            const response = await fetch(`${utils.getBackendBaseUrl()}${endpoint}`, {
                method: 'post',
                mode: 'cors',
                credentials: 'same-origin',
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify(_.omitBy(jsonBody, _.isEmpty)),
            });

            if (!response.ok) {
                const errorResponse: ErrorResponse = await response.json();
                const errors = this._parseErrors(errorResponse.errors);
                this.setState({ ...this.state, isSubmitting: false, errors });

                throw new Error('Request failed');
            }

            this.setState({ ...this.state, isSuccessful: true });
        } catch (e) {
            // Empty block
        }
    }
    private _parseErrors(errors: ErrorResponseProps[]): ErrorProps {
        const initialValue: {} = {};
        return _.reduce(
            errors,
            (hash: ErrorProps, error: ErrorResponseProps) => {
                const { param, msg } = error;
                const key = param;
                hash[key] = msg;

                return hash;
            },
            initialValue,
        );
    }
    private async _getProviderAsync(
        injectedProviderIfExists?: InjectedProvider,
        networkIdIfExists?: number,
        shouldUserLedgerProvider: boolean = false,
    ): Promise<[Provider | undefined, LedgerSubprovider | undefined]> {
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
            /* const rpcSubproviders = _.map(configs.PUBLIC_NODE_URLS_BY_NETWORK_ID[networkIdIfExists], publicNodeUrl => {
                return new RPCSubprovider(publicNodeUrl);
            });
            provider.addProvider(new RedundantSubprovider(rpcSubproviders)); */
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
            return [undefined, undefined];
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
                    //errorReporter.report(err);
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
    private _getNameGivenProvider(provider: Provider): string {
        const providerType = utils.getProviderType(provider);
        const providerNameIfExists = providerToName[providerType];
        if (_.isUndefined(providerNameIfExists)) {
            return constants.PROVIDER_NAME_GENERIC;
        }
        return providerNameIfExists;
    }
    private _setVoteYesPreference(e: Event): void {
        e.preventDefault();
        this._setVotePreference(VoteValue.Yes);
    }
    private _setVoteNoPreference(e: Event): void {
        e.preventDefault();
        this._setVotePreference(VoteValue.No);
    }
    private _setVotePreference(value: VoteValue.No | VoteValue.Yes): void {
        this.setState({ ...this.state, votePreference: value });
    }
    private _parseSignatureHexAsRSV(signatureHex: string): ECSignature {
        const { v, r, s } = ethUtil.fromRpcSig(signatureHex);
        const ecSignature: ECSignature = {
            v,
            r: ethUtil.bufferToHex(r),
            s: ethUtil.bufferToHex(s),
        };
        return ecSignature;
    }
}

// Handle errors: {"errors":[{"location":"body","param":"name","msg":"Invalid value"},{"location":"body","param":"email","msg":"Invalid value"}]}

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
`;

const ButtonDisabled = styled(Button)<{ isDisabled?: boolean; disabled?: boolean }>`
    background-color: ${props => props.disabled && '#898990'};
    opacity: ${props => props.disabled && '0.4'};
`;

const ButtonActive = styled(Button)<{ isActive: boolean; activeColor: string; onClickValue?: string }>`
    background-color: ${props => props.isActive ? props.activeColor : '#898990'};
    width: calc(50% - 15px);

    &:hover {
        background-color: ${props => props.activeColor ? props.activeColor : '#898990'};
    }
`;

const StyledDialogContent = styled(DialogContent)`
    position: relative;
    max-width: 800px;
    background-color: #f6f6f6 !important;
    padding: 60px 60px !important;

    @media (max-width: 768px) {
        width: calc(100vw - 40px) !important;
        margin: 40px auto !important;
        padding: 30px 30px !important;
    }
`;

const Form = styled.form<FormProps>`
    position: relative;
    transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;

    opacity: ${props => props.isSuccessful && `0`};
    visibility: ${props => props.isSuccessful && `hidden`};
`;

const Confirmation = styled.div<FormProps>`
    position: absolute;
    top: 50%;
    text-align: center;
    width: 100%;
    left: 0;
    transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
    transition-delay: 0.4s;
    padding: 60px 60px;
    transform: translateY(-50%);
    opacity: ${props => (props.isSuccessful ? `1` : `0`)};
    visibility: ${props => (props.isSuccessful ? 'visible' : `hidden`)};

    p {
        max-width: 492px;
        margin-left: auto;
        margin-right: auto;
    }
`;
