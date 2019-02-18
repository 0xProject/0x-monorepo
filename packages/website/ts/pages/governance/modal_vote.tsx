import { ContractWrappers } from '@0x/contract-wrappers';
import { LedgerSubprovider } from '@0x/subproviders';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { DialogContent, DialogOverlay } from '@reach/dialog';
import '@reach/dialog/styles.css';
import { Provider } from 'ethereum-types';
import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';
import { GlobalStyle } from 'ts/constants/globalStyle';
import { ConnectForm, WalletConnectedProps } from 'ts/pages/governance/connect_form';
import { ErrorModal } from 'ts/pages/governance/error_modal';
import { VoteForm, VoteInfo } from 'ts/pages/governance/vote_form';
import { colors } from 'ts/style/colors';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';

interface Props {
    theme?: GlobalStyle;
    isOpen?: boolean;
    onDismiss?: () => void;
    onWalletConnected?: (providerName: string) => void;
    onVoted?: (voteInfo: VoteInfo) => void;
}

interface State {
    currentBalance: BigNumber;
    isWalletConnected: boolean;
    providerName: string;
    isSubmitting: boolean;
    isLedger: boolean;
    ledgerSubproviderIfExists?: LedgerSubprovider;
    isSuccessful: boolean;
    isErrorModalOpen?: boolean;
    isU2fSupported: boolean;
    isVoted: boolean;
    votePreference: string | null;
    zeip: number;
    voteHash?: string;
    signedVote?: any;
    errorMessage?: string;
    errors: ErrorProps;
    web3Wrapper?: Web3Wrapper;
    contractWrappers?: ContractWrappers;
    providerEngine?: Provider;
    web3?: any;
    selectedAddress?: string;
}

interface FormProps {
    isSuccessful?: boolean;
    isSubmitting?: boolean;
}

interface ErrorProps {
    [key: string]: string;
}

// This is a copy of the generic form and includes a number of extra fields
// TODO remove the extraneous fields
export class ModalVote extends React.Component<Props> {
    public networkId: number;
    public state: State = {
        currentBalance: new BigNumber(0),
        isWalletConnected: false,
        isU2fSupported: false,
        providerName: 'Metamask',
        selectedAddress: null,
        isSubmitting: false,
        isLedger: false,
        ledgerSubproviderIfExists: null,
        providerEngine: null,
        isSuccessful: false,
        isVoted: false,
        votePreference: null,
        zeip: 23,
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
    public constructor(props: Props) {
        super(props);
    }
    public render(): React.ReactNode {
        const { isOpen, onDismiss } = this.props;
        const { isSuccessful, selectedAddress, currentBalance, isErrorModalOpen, errorMessage } = this.state;
        const formattedBalance = Web3Wrapper.toUnitAmount(currentBalance, constants.DECIMAL_PLACES_ETH).toFixed(
            configs.AMOUNT_DISPLAY_PRECSION,
        );
        return (
            <>
                <DialogOverlay
                    style={{ background: 'rgba(0, 0, 0, 0.75)', zIndex: 30 }}
                    isOpen={isOpen}
                    onDismiss={onDismiss}
                >
                    <StyledDialogContent>
                        {this._renderFormContent()}
                        <Confirmation isSuccessful={isSuccessful}>
                            <Icon name="voting" size="large" margin={[0, 0, 'default', 0]} />
                            <Heading color={colors.textDarkPrimary} size={34} asElement="h2">
                                Vote Recieved!
                            </Heading>
                            <Paragraph isMuted={true} color={colors.textDarkPrimary}>
                                Your vote will help to decide the future of the protocol. You will be receiving a custom
                                “I voted” NFT as a token of our appreciation.
                            </Paragraph>
                            <Paragraph isMuted={true} color={colors.textDarkPrimary}>
                                You voted from {selectedAddress} with {formattedBalance} ZRX
                            </Paragraph>
                            <Button type="button" onClick={this._onDone.bind(this)}>
                                Done
                            </Button>
                        </Confirmation>
                        <ButtonClose type="button" onClick={this.props.onDismiss}>
                            <span>Close</span>
                            <Icon name="close-modal" size={27} margin={[0, 0, 0, 0]} />
                        </ButtonClose>
                        <ErrorModal
                            isOpen={isErrorModalOpen}
                            text={errorMessage}
                            onClose={this._onCloseError.bind(this)}
                        />
                    </StyledDialogContent>
                </DialogOverlay>
            </>
        );
    }
    public _renderFormContent(): React.ReactNode {
        switch (this.state.isWalletConnected) {
            case true:
                return this._renderVoteFormContent();
            case false:
            default:
                return this._renderConnectWalletFormContent();
        }
    }
    private _renderConnectWalletFormContent(): React.ReactNode {
        const { web3Wrapper } = this.state;
        return (
            <>
                <ConnectForm
                    web3Wrapper={web3Wrapper}
                    onDismiss={this.props.onDismiss}
                    onWalletConnected={this._onWalletConnected.bind(this)}
                    onError={this._onError.bind(this)}
                />
            </>
        );
    }
    private _renderVoteFormContent(): React.ReactNode {
        const {
            currentBalance,
            selectedAddress,
            web3Wrapper,
            isLedger,
            web3,
            ledgerSubproviderIfExists,
            providerEngine,
        } = this.state;
        return (
            <>
                <VoteForm
                    currentBalance={currentBalance}
                    selectedAddress={selectedAddress}
                    web3Wrapper={web3Wrapper}
                    injectedProvider={web3}
                    onDismiss={this.props.onDismiss}
                    isLedger={isLedger}
                    ledgerSubproviderIfExists={ledgerSubproviderIfExists}
                    provider={providerEngine}
                    onVoted={this._onVoted.bind(this)}
                    onError={this._onError.bind(this)}
                />
            </>
        );
    }
    private _onWalletConnected(props: WalletConnectedProps): void {
        const {
            contractWrappers,
            selectedAddress,
            currentBalance,
            providerName,
            injectedProviderIfExists,
            web3Wrapper,
            isLedger,
            ledgerSubproviderIfExists,
            providerEngine,
        } = props;

        this.setState({
            ...this.state,
            web3Wrapper,
            contractWrappers,
            web3: injectedProviderIfExists,
            isWalletConnected: true,
            providerName,
            currentBalance,
            selectedAddress,
            isLedger,
            ledgerSubproviderIfExists,
            providerEngine,
        });

        this.props.onWalletConnected(providerName);
    }
    private _onVoted(voteInfo: VoteInfo): void {
        this.setState({
            isSuccessful: true,
        });

        if (this.props.onVoted) {
            this.props.onVoted(voteInfo);
        }
    }
    private _onDone(): void {
        this.setState({
            isErrorModalOpen: false,
            isSuccessful: false,
        });

        this.props.onDismiss();
    }
    private _onError(errorMessage: string): void {
        this.setState({
            errorMessage,
            isErrorModalOpen: true,
        });
    }
    private _onCloseError(): void {
        this.setState({
            errorMessage: '',
            isErrorModalOpen: false,
        });
    }
}

const ButtonClose = styled.button.attrs({})`
    cursor: pointer;
    position: absolute;
    right: 0;
    top: 0;
    overflow: hidden;
    width: 27px;
    height: 27px;
    border: 0;
    background-color: transparent;
    padding: 0;
    transform: translateY(-47px);

    span {
        opacity: 0;
        visibility: hidden;
        position: absolute;
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
