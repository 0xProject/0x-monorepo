import * as _ from 'lodash';
import * as React from 'react';

import { BigNumber } from '@0xproject/utils';
import { Blockchain } from 'ts/blockchain';
import { OnboardingFlow, Step } from 'ts/components/onboarding/onboarding_flow';
import { AllowanceToggle } from 'ts/containers/inputs/allowance_toggle';
import { ProviderType, Token, TokenByAddress, TokenStateByAddress } from 'ts/types';
import { utils } from 'ts/utils/utils';

export interface PortalOnboardingFlowProps {
    blockchain: Blockchain;
    stepIndex: number;
    isRunning: boolean;
    userAddress: string;
    hasBeenSeen: boolean;
    providerType: ProviderType;
    injectedProviderName: string;
    blockchainIsLoaded: boolean;
    userEtherBalanceInWei?: BigNumber;
    tokenByAddress: TokenByAddress;
    trackedTokenStateByAddress: TokenStateByAddress;
    updateIsRunning: (isRunning: boolean) => void;
    updateOnboardingStep: (stepIndex: number) => void;
    refetchTokenStateAsync: (tokenAddress: string) => Promise<void>;
}

export class PortalOnboardingFlow extends React.Component<PortalOnboardingFlowProps> {
    public componentDidMount(): void {
        this._overrideOnboardingStateIfShould();
    }
    public componentDidUpdate(): void {
        this._overrideOnboardingStateIfShould();
    }
    public render(): React.ReactNode {
        return (
            <OnboardingFlow
                steps={this._getSteps()}
                stepIndex={this.props.stepIndex}
                isRunning={this.props.isRunning}
                onClose={this.props.updateIsRunning.bind(this, false)}
                updateOnboardingStep={this.props.updateOnboardingStep}
            />
        );
    }
    private _getSteps(): Step[] {
        const steps: Step[] = [
            {
                target: '.wallet',
                content:
                    'Before you begin, you need to connect to a wallet. This will be used across all 0x relayers and dApps',
                placement: 'right',
                hideBackButton: true,
                hideNextButton: true,
            },
            {
                target: '.wallet',
                content: 'Unlock your metamask extension to begin',
                placement: 'right',
                hideBackButton: true,
                hideNextButton: true,
            },
            {
                target: '.wallet',
                content:
                    'In order to start trading on any 0x relayer in the 0x ecosystem, you need to complete two simple steps',
                placement: 'right',
                hideBackButton: true,
                continueButtonDisplay: 'enabled',
            },
            {
                target: '.eth-row',
                content: 'Before you begin you will need to send some ETH to your metamask wallet',
                placement: 'right',
                continueButtonDisplay: this._userHasVisibleEth() ? 'enabled' : 'disabled',
            },
            {
                target: '.weth-row',
                content: 'You need to convert some of your ETH into tradeable Wrapped ETH (WETH)',
                placement: 'right',
                continueButtonDisplay: this._userHasVisibleWeth() ? 'enabled' : 'disabled',
            },
            {
                target: '.weth-row',
                content: <div>
                    Unlock your tokens for trading. You only need to do this once for each token.
                    <div> ETH: {this._renderEthAllowanceToggle()}</div>
                    <div> ZRX: {this._renderZrxAllowanceToggle()}</div>
                </div>,
                placement: 'right',
                continueButtonDisplay: this._userHasAllowancesForWethAndZrx() ? 'enabled' : 'disabled',
            },
            {
                target: '.wallet',
                content:
                    'Congrats! Your wallet is now set up for trading. Use it on any relayer in the 0x ecosystem.',
                placement: 'right',
                continueButtonDisplay: 'enabled',
            },
        ];
        return steps;
    }
    private _isAddressAvailable(): boolean {
        return !_.isEmpty(this.props.userAddress);
    }
    private _userHasVisibleEth(): boolean {
        return this.props.userEtherBalanceInWei > new BigNumber(0);
    }
    private _userHasVisibleWeth(): boolean {
        const ethToken = utils.getEthToken(this.props.tokenByAddress);
        if (!ethToken) {
            return false;
        }
        const wethTokenState = this.props.trackedTokenStateByAddress[ethToken.address];
        return wethTokenState.balance > new BigNumber(0);
    }
    private _userHasAllowancesForWethAndZrx(): boolean {
        const ethToken = utils.getEthToken(this.props.tokenByAddress);
        const zrxToken = utils.getZrxToken(this.props.tokenByAddress);
        if (ethToken && zrxToken) {
            const ethTokenAllowance = this.props.trackedTokenStateByAddress[ethToken.address].allowance;
            const zrxTokenAllowance = this.props.trackedTokenStateByAddress[zrxToken.address].allowance;
            return ethTokenAllowance > new BigNumber(0) && zrxTokenAllowance > new BigNumber(0);
        }
        return false;
    }
    private _overrideOnboardingStateIfShould(): void {
        this._autoStartOnboardingIfShould();
        this._adjustStepIfShould();
    }

    private _adjustStepIfShould(): void {
        const stepIndex = this.props.stepIndex;
        if (this._isAddressAvailable()) {
            if (stepIndex < 2) {
                this.props.updateOnboardingStep(2);
            }
            return;
        }
        const isExternallyInjected = utils.isExternallyInjected(
            this.props.providerType,
            this.props.injectedProviderName,
        );
        if (isExternallyInjected) {
            if (stepIndex !== 1) {
                this.props.updateOnboardingStep(1);
            }
            return;
        }
        if (stepIndex !== 0) {
            this.props.updateOnboardingStep(0);
        }
    }
    private _autoStartOnboardingIfShould(): void {
        if (!this.props.isRunning && !this.props.hasBeenSeen && this.props.blockchainIsLoaded) {
            this.props.updateIsRunning(true);
        }
    }
    private _renderZrxAllowanceToggle(): React.ReactNode {
        const zrxToken = utils.getZrxToken(this.props.tokenByAddress);
        return this._renderAllowanceToggle(zrxToken);
    }
    private _renderEthAllowanceToggle(): React.ReactNode {
        const ethToken = utils.getEthToken(this.props.tokenByAddress);
        return this._renderAllowanceToggle(ethToken);
    }
    private _renderAllowanceToggle(token: Token): React.ReactNode {
        if (!token) {
            return null;
        }
        const tokenState = this.props.trackedTokenStateByAddress[token.address];
        return (
            <AllowanceToggle
                token={token}
                tokenState={tokenState}
                isDisabled={!tokenState.isLoaded}
                blockchain={this.props.blockchain}
                // tslint:disable-next-line:jsx-no-lambda
                refetchTokenStateAsync={async () => this.props.refetchTokenStateAsync(token.address)}
            />
        );
    }
}
