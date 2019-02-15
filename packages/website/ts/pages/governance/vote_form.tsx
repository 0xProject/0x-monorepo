import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

// tslint:disable-next-line: no-duplicate-imports
import { ChangeEvent, FormEvent } from 'react';

import { colors } from 'ts/style/colors';

import '@reach/dialog/styles.css';

import { ContractWrappers } from '@0x/contract-wrappers';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { Button } from 'ts/components/button';
import { Input } from 'ts/components/modals/input';
import { Heading, Paragraph } from 'ts/components/text';
import { PreferenceSelecter } from 'ts/pages/governance/preference_selecter';

import { signatureUtils } from '0x.js';
import * as ethUtil from 'ethereumjs-util';

import { ECSignature, SignatureType } from '@0x/types';

import {
    LedgerSubprovider,
} from '@0x/subproviders';
import { Provider } from 'ethereum-types';
import {
    InjectedProvider,
} from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';

export enum VoteValue {
    Yes = 'Yes',
    No = 'No',
}

interface Props {
    onDismiss?: () => void;
    onWalletConnected?: (providerName: string) => void;
    onVoted?: () => void;
    web3Wrapper?: Web3Wrapper;
    contractWrappers?: ContractWrappers;
    currentBalance?: BigNumber;
    selectedAddress: string;
    isLedger: boolean;
    injectedProvider?: InjectedProvider;
    ledgerSubproviderIfExists?: LedgerSubprovider;
    providerEngine?: Provider;
    web3?: any;
}

interface State {
    isWalletConnected: boolean;
    isSubmitting: boolean;
    isSuccessful: boolean;
    isVoted: boolean;
    selectedAddress?: string;
    votePreference?: string;
    zeip: string;
    voteHash?: string;
    signedVote?: any;
    errorMessage?: string;
    errors: ErrorProps;
    web3?: any;
}

interface FormProps {
    isSuccessful?: boolean;
    isSubmitting?: boolean;
}

interface ErrorProps {
    [key: string]: string;
}

export class VoteForm extends React.Component<Props> {
    public static defaultProps = {
        currentBalance: new BigNumber(0),
        isWalletConnected: false,
        isSubmitting: false,
        isSuccessful: false,
        isLedger: false,
        isVoted: false,
        zeip: '1',
        errors: {},
    };
    public networkId: number;
    public state: State = {
        isWalletConnected: false,
        isSubmitting: false,
        isSuccessful: false,
        isVoted: false,
        votePreference: null,
        zeip: '1',
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
        const { votePreference, errors, isSuccessful } = this.state;
        const { currentBalance, selectedAddress } = this.props;
        const formattedBalance = Web3Wrapper.toUnitAmount(currentBalance, constants.DECIMAL_PLACES_ETH)
            .toNumber()
            .toFixed(configs.AMOUNT_DISPLAY_PRECSION);
        return (
            <Form onSubmit={this._createVoteAsync.bind(this)} isSuccessful={isSuccessful}>
                <Heading color={colors.textDarkPrimary} size={34} asElement="h2">
                    MultiAssetProxy Vote
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
                        errors={errors}
                    />
                </InputRow>
                {!_.isUndefined(errors.signError) && (
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
                </ButtonRow>
            </Form>
        );
    }
    private readonly _createVoteAsync = async (e: FormEvent): Promise<any> => {
        e.preventDefault();

        const { zeip, votePreference } = this.state;
        const { selectedAddress, isLedger, providerEngine } = this.props;
        // Query the available addresses
        // const addresses = await web3Wrapper.getAvailableAddressesAsync();
        // Use the first account as the maker
        // const makerAddress = addresses[0];
        const makerAddress = selectedAddress;
        const domainType = [{ name: 'name', type: 'string' }];
        const voteType = [
            { name: 'preference', type: 'string' },
            { name: 'zeip', type: 'uint256' },
            { name: 'from', type: 'address' },
            // { name: 'title', type: 'string' },
        ];

        const domainData = {
            name: '0x Protocol Governance',
        };
        const message = {
            zeip,
            preference: votePreference,
            from: makerAddress,
            // title: 'MultiAssetProxy: Allow multiple assets per side of a single order',
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
            // const provider = web3Wrapper.getProvider();
            const signature = isLedger
                ? await signatureUtils.ecSignHashAsync(providerEngine, voteHashHex, makerAddress)
                : await this._eip712SignatureAsync(makerAddress, typedData);
            const signedVote = { ...message, signature, from: makerAddress };
            const isProduction = window.location.host.includes('0x.org');
            const voteEndpoint = isProduction ? 'https://vote.0x.org/v1/vote' : 'http://localhost:3000/v1/vote';

            // Store the signed Order
            this.setState(prevState => ({ ...prevState, signedVote, voteHash: voteHashHex, isSuccessful: true }));
            await fetch(voteEndpoint, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signedVote),
            });

            if (this.props.onVoted) {
                this.props.onVoted();
            }

            return signedVote;
        } catch (err) {
            // console.log(err);
            this.setState({ errors: { signError: err.message }, isSuccessful: false });
            return null as any;
        }
    };
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
    private _setVotePreference(e: ChangeEvent<HTMLInputElement>): void {
        this.setState({
            votePreference: e.currentTarget.value,
        });
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
