import { constants as sharedConstants } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { BigNumber } from '@0xproject/utils';
import { Blockchain } from 'ts/blockchain';
import { AddEthOnboardingStep } from 'ts/components/onboarding/add_eth_onboarding_step';
import { CongratsOnboardingStep } from 'ts/components/onboarding/congrats_onboarding_step';
import { InstallWalletOnboardingStep } from 'ts/components/onboarding/install_wallet_onboarding_step';
import { IntroOnboardingStep } from 'ts/components/onboarding/intro_onboarding_step';
import { OnboardingFlow, Step } from 'ts/components/onboarding/onboarding_flow';
import { SetAllowancesOnboardingStep } from 'ts/components/onboarding/set_allowances_onboarding_step';
import { UnlockWalletOnboardingStep } from 'ts/components/onboarding/unlock_wallet_onboarding_step';
import {
    WrapEthOnboardingStep1,
    WrapEthOnboardingStep2,
    WrapEthOnboardingStep3,
} from 'ts/components/onboarding/wrap_eth_onboarding_step';
import { AllowanceToggle } from 'ts/containers/inputs/allowance_toggle';
import { ProviderType, ScreenWidths, Token, TokenByAddress, TokenStateByAddress } from 'ts/types';
import { analytics } from 'ts/utils/analytics';
import { utils } from 'ts/utils/utils';

export interface PortalOnboardingFlowProps extends RouteComponentProps<any> {
    networkId: number;
    blockchain: Blockchain;
    stepIndex: number;
    isRunning: boolean;
    userAddress: string;
    hasBeenClosed: boolean;
    providerType: ProviderType;
    injectedProviderName: string;
    blockchainIsLoaded: boolean;
    userEtherBalanceInWei?: BigNumber;
    tokenByAddress: TokenByAddress;
    trackedTokenStateByAddress: TokenStateByAddress;
    updateIsRunning: (isRunning: boolean) => void;
    updateOnboardingStep: (stepIndex: number) => void;
    refetchTokenStateAsync: (tokenAddress: string) => Promise<void>;
    screenWidth: ScreenWidths;
}

class PlainPortalOnboardingFlow extends React.Component<PortalOnboardingFlowProps> {
    private _unlisten: () => void;
    public componentDidMount(): void {
        this._autoStartOnboardingIfShould();
        this._adjustStepIfShould();
        // If there is a route change, just close onboarding.
        this._unlisten = this.props.history.listen(() => this.props.updateIsRunning(false));
    }
    public componentWillUnmount(): void {
        this._unlisten();
    }
    public componentDidUpdate(): void {
        this._adjustStepIfShould();
    }
    public render(): React.ReactNode {
        return (
            <OnboardingFlow
                steps={this._getSteps()}
                stepIndex={this.props.stepIndex}
                isRunning={this.props.isRunning}
                onClose={this._closeOnboarding.bind(this)}
                updateOnboardingStep={this._updateOnboardingStep.bind(this)}
                disableOverlay={this.props.screenWidth === ScreenWidths.Sm}
                isMobile={this.props.screenWidth === ScreenWidths.Sm}
            />
        );
    }
    private _getSteps(): Step[] {
        const steps: Step[] = [
            {
                target: '.wallet',
                title: '0x Ecosystem Setup',
                content: <InstallWalletOnboardingStep />,
                placement: 'right',
                shouldHideBackButton: true,
                shouldHideNextButton: true,
            },
            {
                target: '.wallet',
                title: '0x Ecosystem Setup',
                content: <UnlockWalletOnboardingStep />,
                placement: 'right',
                shouldHideBackButton: true,
                shouldHideNextButton: true,
            },
            {
                target: '.wallet',
                title: '0x Ecosystem Account Setup',
                content: <IntroOnboardingStep />,
                placement: 'right',
                shouldHideBackButton: true,
                continueButtonDisplay: 'enabled',
            },
            {
                target: '.wallet',
                title: 'Step 1: Add ETH',
                content: (
                    <AddEthOnboardingStep userEthBalanceInWei={this.props.userEtherBalanceInWei || new BigNumber(0)} />
                ),
                placement: 'right',
                continueButtonDisplay: this._userHasVisibleEth() ? 'enabled' : 'disabled',
            },
            {
                target: '.wallet',
                title: 'Step 2: Wrap ETH',
                content: <WrapEthOnboardingStep1 />,
                placement: 'right',
                continueButtonDisplay: 'enabled',
            },
            {
                target: '.wallet',
                title: 'Step 2: Wrap ETH',
                content: <WrapEthOnboardingStep2 />,
                placement: 'right',
                continueButtonDisplay: this._userHasVisibleWeth() ? 'enabled' : 'disabled',
            },
            {
                target: '.wallet',
                title: 'Step 2: Wrap ETH',
                content: (
                    <WrapEthOnboardingStep3
                        formattedWethBalanceIfExists={
                            this._userHasVisibleWeth() ? this._getFormattedWethBalance() : undefined
                        }
                    />
                ),
                placement: 'right',
                continueButtonDisplay: this._userHasVisibleWeth() ? 'enabled' : 'disabled',
            },
            {
                target: '.wallet',
                title: 'Step 3: Unlock Tokens',
                content: (
                    <SetAllowancesOnboardingStep
                        zrxAllowanceToggle={this._renderZrxAllowanceToggle()}
                        ethAllowanceToggle={this._renderEthAllowanceToggle()}
                        userHasAllowancesForWethAndZrx={this._userHasAllowancesForWethAndZrx()}
                    />
                ),
                placement: 'right',
                continueButtonDisplay: this._userHasAllowancesForWethAndZrx() ? 'enabled' : 'disabled',
            },
            {
                target: '.wallet',
                title: '🎉  The Ecosystem Awaits',
                content: <CongratsOnboardingStep />,
                placement: 'right',
                continueButtonDisplay: 'enabled',
                shouldHideNextButton: true,
                continueButtonText: 'Enter the 0x Ecosystem',
                onContinueButtonClick: this._handleFinalStepContinueClick.bind(this),
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
    private _getWethBalance(): BigNumber {
        const ethToken = utils.getEthToken(this.props.tokenByAddress);
        if (!ethToken) {
            return new BigNumber(0);
        }
        const ethTokenState = this.props.trackedTokenStateByAddress[ethToken.address];
        return ethTokenState.balance;
    }
    private _getFormattedWethBalance(): string {
        const ethToken = utils.getEthToken(this.props.tokenByAddress);
        const ethTokenState = this.props.trackedTokenStateByAddress[ethToken.address];
        return utils.getFormattedAmountFromToken(ethToken, ethTokenState);
    }
    private _userHasVisibleWeth(): boolean {
        return this._getWethBalance() > new BigNumber(0);
    }
    private _userHasAllowancesForWethAndZrx(): boolean {
        const ethToken = utils.getEthToken(this.props.tokenByAddress);
        const zrxToken = utils.getZrxToken(this.props.tokenByAddress);
        if (ethToken && zrxToken) {
            const ethTokenState = this.props.trackedTokenStateByAddress[ethToken.address];
            const zrxTokenState = this.props.trackedTokenStateByAddress[zrxToken.address];
            if (ethTokenState && zrxTokenState) {
                return ethTokenState.allowance.gt(0) && zrxTokenState.allowance.gt(0);
            }
        }
        return false;
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
        if (
            (this.props.stepIndex === 0 && !this.props.isRunning) ||
            (!this.props.isRunning && !this.props.hasBeenClosed && this.props.blockchainIsLoaded)
        ) {
            const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
            analytics.logEvent('Portal', 'Onboarding Started - Automatic', networkName, this.props.stepIndex);
            this.props.updateIsRunning(true);
            // On mobile, make sure the wallet is completely visible.
            if (utils.isMobile(this.props.screenWidth)) {
                document.querySelector('.wallet').scrollIntoView();
            }
        }
    }
    private _updateOnboardingStep(stepIndex: number): void {
        const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
        this.props.updateOnboardingStep(stepIndex);
        analytics.logEvent('Portal', 'Update Onboarding Step', networkName, stepIndex);
    }
    private _closeOnboarding(): void {
        const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
        this.props.updateIsRunning(false);
        analytics.logEvent('Portal', 'Onboarding Closed', networkName, this.props.stepIndex);
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
        const tokenStateIfExists = this.props.trackedTokenStateByAddress[token.address];
        if (_.isUndefined(tokenStateIfExists)) {
            return null;
        }
        return (
            <AllowanceToggle
                token={token}
                tokenState={tokenStateIfExists}
                isDisabled={!tokenStateIfExists.isLoaded}
                blockchain={this.props.blockchain}
                // tslint:disable-next-line:jsx-no-lambda
                refetchTokenStateAsync={async () => this.props.refetchTokenStateAsync(token.address)}
            />
        );
    }
    private _handleFinalStepContinueClick(): void {
        if (utils.isMobile(this.props.screenWidth)) {
            window.scrollTo(0, 0);
            this.props.history.push('/portal');
        }
        this._closeOnboarding();
    }
}

export const PortalOnboardingFlow = withRouter(PlainPortalOnboardingFlow);
