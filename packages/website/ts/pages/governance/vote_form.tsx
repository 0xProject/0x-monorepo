import { ContractWrappers } from '@0x/contract-wrappers';
import { signatureUtils } from '@0x/order-utils';
import { LedgerSubprovider } from '@0x/subproviders';
import { ECSignature, SignatureType } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import '@reach/dialog/styles.css';
import { ZeroExProvider } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Input } from 'ts/components/modals/input';
import { Heading, Paragraph } from 'ts/components/text';
import { LedgerSignNote } from 'ts/pages/governance/ledger_sign_note';
import { PreferenceSelecter } from 'ts/pages/governance/preference_selecter';
import { colors } from 'ts/style/colors';
import { InjectedProvider } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { environments } from 'ts/utils/environments';

export enum VoteValue {
    Yes = 'Yes',
    No = 'No',
}

export interface VoteInfo {
    userBalance: BigNumber;
    voteValue: VoteValue;
}

interface Props {
    onDismiss?: () => void;
    onWalletConnected?: (providerName: string) => void;
    onError?: (errorMessage: string) => void;
    onVoted?: (userInfo: VoteInfo) => void;
    web3Wrapper?: Web3Wrapper;
    contractWrappers?: ContractWrappers;
    currentBalance?: BigNumber;
    selectedAddress: string;
    isLedger: boolean;
    injectedProvider?: InjectedProvider;
    ledgerSubproviderIfExists?: LedgerSubprovider;
    provider?: ZeroExProvider;
    zeipId: number;
}

interface State {
    isWalletConnected: boolean;
    isSubmitting: boolean;
    isSuccessful: boolean;
    isAwaitingLedgerSignature: boolean;
    isVoted: boolean;
    selectedAddress?: string;
    votePreference?: string;
    voteHash?: string;
    signedVote?: SignedVote;
    comment?: string;
    errorMessage?: string;
    errors: ErrorProps;
}

interface SignedVote {
    signature: string;
    from: string;
    zeip: number;
    preference: string;
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
export class VoteForm extends React.Component<Props> {
    public static defaultProps = {
        currentBalance: new BigNumber(0),
        isWalletConnected: false,
        isSubmitting: false,
        isSuccessful: false,
        isLedger: false,
        isVoted: false,
        errors: {},
    };
    public networkId: number;
    public state: State = {
        isWalletConnected: false,
        isAwaitingLedgerSignature: false,
        isSubmitting: false,
        isSuccessful: false,
        isVoted: false,
        votePreference: null,
        errors: {},
    };
    // shared fields
    public commentsRef: React.RefObject<HTMLInputElement> = React.createRef();
    public constructor(props: Props) {
        super(props);
    }
    public render(): React.ReactNode {
        const { votePreference, errors, isSuccessful, isAwaitingLedgerSignature } = this.state;
        const { currentBalance, selectedAddress, zeipId } = this.props;
        const bigNumberFormat = {
            decimalSeparator: '.',
            groupSeparator: ',',
            groupSize: 3,
            secondaryGroupSize: 0,
            fractionGroupSeparator: ' ',
            fractionGroupSize: 0,
        };
        const formattedBalance = Web3Wrapper.toUnitAmount(currentBalance, constants.DECIMAL_PLACES_ETH).toFormat(
            0,
            BigNumber.ROUND_FLOOR,
            bigNumberFormat,
        );
        return (
            <Form onSubmit={this._createAndSubmitVoteAsync.bind(this)} isSuccessful={isSuccessful}>
                <Heading color={colors.textDarkPrimary} size={34} asElement="h2">
                    ZEIP-{zeipId} Vote
                </Heading>
                <Paragraph isMuted={true} color={colors.textDarkPrimary}>
                    Make sure you are informed to the best of your ability before casting your vote. It will have
                    lasting implications for the 0x ecosystem.
                </Paragraph>
                <PreferenceWrapper>
                    <PreferenceSelecter
                        label="Accept Proposal"
                        value={VoteValue.Yes}
                        isActive={votePreference === VoteValue.Yes}
                        onChange={this._setVotePreference.bind(this)}
                    />
                    <PreferenceSelecter
                        label="Reject Proposal"
                        value={VoteValue.No}
                        isActive={votePreference === VoteValue.No}
                        onChange={this._setVotePreference.bind(this)}
                    />
                </PreferenceWrapper>
                <Paragraph isMuted={true} color={colors.textDarkPrimary}>
                    <strong>Voting address:</strong> {selectedAddress}
                    <br />
                    <strong>Voting balance:</strong> {formattedBalance} ZRX
                </Paragraph>
                <InputRow>
                    <Input
                        name="comments"
                        label="Leave a private message for the 0x team (Optional)"
                        type="textarea"
                        ref={this.commentsRef}
                        onChange={this._setVoteComment.bind(this)}
                        errors={errors}
                    />
                </InputRow>
                {errors.signError !== undefined && (
                    <Paragraph isMuted={true} color={colors.red}>
                        {errors.signError}
                    </Paragraph>
                )}
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
                    <ButtonDisabled disabled={!votePreference}>Submit</ButtonDisabled>
                    <LedgerSignNote
                        text={'Accept or reject signature on the Ledger'}
                        isVisible={isAwaitingLedgerSignature}
                    />
                </ButtonRow>
            </Form>
        );
    }
    private readonly _createAndSubmitVoteAsync = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        const { votePreference, comment } = this.state;
        const { currentBalance, selectedAddress, isLedger, zeipId } = this.props;
        const makerAddress = selectedAddress;

        if (isLedger) {
            this.setState({ isAwaitingLedgerSignature: true });
        }

        const domainType = [{ name: 'name', type: 'string' }];
        const voteType = [
            { name: 'preference', type: 'string' },
            { name: 'zeip', type: 'uint256' },
            { name: 'from', type: 'address' },
        ];
        const domainData = {
            name: '0x Protocol Governance',
        };
        const message = {
            zeip: zeipId,
            preference: votePreference,
            from: makerAddress,
        };
        const typedData = {
            types: {
                EIP712Domain: domainType,
                Vote: voteType,
            },
            domain: domainData,
            message,
            primaryType: 'Vote',
        };

        const voteHashBuffer = signTypedDataUtils.generateTypedDataHash(typedData);
        const voteHashHex = `0x${voteHashBuffer.toString('hex')}`;
        try {
            const signedVote = await this._signVoteAsync(makerAddress, typedData);
            // Store the signed vote
            this.setState(prevState => ({
                ...prevState,
                signedVote,
                voteHash: voteHashHex,
                isSuccessful: true,
                isAwaitingLedgerSignature: false,
            }));

            const voteDomain = environments.isProduction()
                ? `https://${configs.DOMAIN_VOTE}`
                : `https://${configs.DOMAIN_VOTE}/staging`;
            const voteEndpoint = `${voteDomain}/v1/vote`;
            const requestBody = { ...signedVote, comment };
            const response = await fetch(voteEndpoint, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            if (response.ok) {
                if (this.props.onVoted) {
                    this.props.onVoted({
                        userBalance: currentBalance,
                        voteValue: this._getVoteValueFromString(votePreference),
                    });
                }
            } else {
                const responseBody = await response.json();
                const errorMessage = responseBody.reason !== undefined ? responseBody.reason : 'Unknown Error';
                this._handleError(errorMessage);
            }
        } catch (err) {
            this._handleError(err.message);
        }
    };
    private _handleError(errorMessage: string): void {
        const { onError } = this.props;
        onError
            ? onError(errorMessage)
            : this.setState({
                  errors: {
                      signError: errorMessage,
                  },
                  isSuccessful: false,
                  isAwaitingLedgerSignature: false,
              });
        this.setState({
            isAwaitingLedgerSignature: false,
        });
    }
    private async _signVoteAsync(signerAddress: string, typedData: any): Promise<SignedVote> {
        const { provider: providerEngine } = this.props;
        let signatureHex;

        try {
            signatureHex = await this._eip712SignatureAsync(signerAddress, typedData);
        } catch (err) {
            // HACK: We are unable to handle specific errors thrown since provider is not an object
            //       under our control. It could be Metamask Web3, Ethers, or any general RPC provider.
            //       We check for a user denying the signature request in a way that supports Metamask and
            //       Coinbase Wallet. Unfortunately for signers with a different error message,
            //       they will receive two signature requests.
            if (err.message.includes('User denied message signature')) {
                throw err;
            }

            const voteHashBuffer = signTypedDataUtils.generateTypedDataHash(typedData);
            const voteHashHex = `0x${voteHashBuffer.toString('hex')}`;
            signatureHex = await signatureUtils.ecSignHashAsync(providerEngine, voteHashHex, signerAddress);
        }
        const signedVote = { ...typedData.message, signature: signatureHex };
        return signedVote;
    }
    private readonly _eip712SignatureAsync = async (address: string, typedData: any): Promise<string> => {
        const signature = await this.props.web3Wrapper.signTypedDataAsync(address, typedData);
        const ecSignatureRSV = this._parseSignatureHexAsRSV(signature);
        const signatureBuffer = Buffer.concat([
            ethUtil.toBuffer(ecSignatureRSV.v),
            ethUtil.toBuffer(ecSignatureRSV.r),
            ethUtil.toBuffer(ecSignatureRSV.s),
            ethUtil.toBuffer(SignatureType.EIP712),
        ]);
        const signatureHex = `0x${signatureBuffer.toString('hex')}`;
        return signatureHex;
    };
    private _parseSignatureHexAsRSV(signatureHex: string): ECSignature {
        const { v, r, s } = ethUtil.fromRpcSig(signatureHex);
        const ecSignature: ECSignature = {
            v,
            r: ethUtil.bufferToHex(r),
            s: ethUtil.bufferToHex(s),
        };
        return ecSignature;
    }
    private _setVotePreference(e: React.ChangeEvent<HTMLInputElement>): void {
        this.setState({
            votePreference: e.currentTarget.value,
        });
    }
    private _setVoteComment(e: React.ChangeEvent<any>): void {
        this.setState({
            comment: e.currentTarget.value,
        });
    }
    private _getVoteValueFromString(value: string): VoteValue {
        return VoteValue.Yes === value ? VoteValue.Yes : VoteValue.No;
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
    position: relative;

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

const ButtonDisabled = styled(Button)<{ isDisabled?: boolean; disabled?: boolean }>`
    background-color: ${props => props.disabled && '#898990'};
    opacity: ${props => props.disabled && '0.4'};
`;
const Form = styled.form<FormProps>`
    position: relative;
    transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;

    opacity: ${props => props.isSuccessful && `0`};
    visibility: ${props => props.isSuccessful && `hidden`};
`;
const PreferenceWrapper = styled.div`
    margin-bottom: 30px;
`;
