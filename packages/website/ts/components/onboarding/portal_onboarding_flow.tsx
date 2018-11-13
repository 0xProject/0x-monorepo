import * as _ from 'lodash';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { BigNumber } from '@0x/utils';
import { Blockchain } from 'ts/blockchain';
import { AddEthOnboardingStep } from 'ts/components/onboarding/add_eth_onboarding_step';
import { CongratsOnboardingStep } from 'ts/components/onboarding/congrats_onboarding_step';
import { InstallWalletOnboardingStep } from 'ts/components/onboarding/install_wallet_onboarding_step';
import { IntroOnboardingStep } from 'ts/components/onboarding/intro_onboarding_step';
import {
    FixedPositionSettings,
    OnboardingFlow,
    Step,
    TargetPositionSettings,
} from 'ts/components/onboarding/onboarding_flow';
import { SetAllowancesOnboardingStep } from 'ts/components/onboarding/set_allowances_onboarding_step';
import { UnlockWalletOnboardingStep } from 'ts/components/onboarding/unlock_wallet_onboarding_step';
import {
    WrapEthOnboardingStep1,
    WrapEthOnboardingStep2,
    WrapEthOnboardingStep3,
} from 'ts/components/onboarding/wrap_eth_onboarding_step';
import { AllowanceStateToggle } from 'ts/containers/inputs/allowance_state_toggle';
import { BrowserType, ProviderType, ScreenWidths, Token, TokenByAddress, TokenStateByAddress } from 'ts/types';
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
        this._adjustStepIfShould();
        // If there is a route change, just close onboarding.
        this._unlisten = this.props.history.listen(() => this.props.updateIsRunning(false));
    }
    public componentWillUnmount(): void {
        this._unlisten();
    }
    public componentDidUpdate(prevProps: PortalOnboardingFlowProps): void {
        // Any one of steps 0-3 could be the starting step, and we only want to reset the scroll on the starting step.
        if (this.props.isRunning && utils.isMobileWidth(this.props.screenWidth) && this.props.stepIndex < 3) {
            // On mobile, make sure the wallet is completely visible.
            document.querySelector('.wallet').scrollIntoView();
        }
        this._adjustStepIfShould();
        if (!prevProps.blockchainIsLoaded && this.props.blockchainIsLoaded) {
            this._autoStartOnboardingIfShould();
        }
    }
    public render(): React.ReactNode {
        const browserType = utils.getBrowserType();
        return (
            <OnboardingFlow
                steps={this._getSteps()}
                stepIndex={this.props.stepIndex}
                isRunning={this.props.isRunning}
                onClose={this._closeOnboarding.bind(this)}
                updateOnboardingStep={this._updateOnboardingStep.bind(this)}
                disableOverlay={this.props.screenWidth === ScreenWidths.Sm}
                isMobile={this.props.screenWidth === ScreenWidths.Sm}
                // This is necessary to ensure onboarding stays open once the user unlocks metamask and clicks away
                disableCloseOnClickOutside={browserType === BrowserType.Firefox || browserType === BrowserType.Opera}
            />
        );
    }
    private _getSteps(): Step[] {
        const nextToWalletPosition: TargetPositionSettings = {
            type: 'target',
            target: '.wallet',
            placement: 'right',
        };
        const underMetamaskExtension: FixedPositionSettings = {
            type: 'fixed',
            top: '10px',
            right: '10px',
            tooltipPointerDisplay: 'none',
        };
        const steps: Step[] = [
            {
                position: nextToWalletPosition,
                title: '0x Ecosystem Setup',
                content: <InstallWalletOnboardingStep />,
                shouldHideBackButton: true,
                shouldHideNextButton: true,
            },
            {
                position: underMetamaskExtension,
                title: 'Please Unlock Metamask...',
                content: <UnlockWalletOnboardingStep />,
                shouldHideBackButton: true,
                shouldHideNextButton: true,
                shouldCenterTitle: true,
                shouldRemoveExtraSpacing: true,
            },
            {
                position: nextToWalletPosition,
                title: '0x Ecosystem Account Setup',
                content: <IntroOnboardingStep />,
                shouldHideBackButton: true,
                continueButtonDisplay: 'enabled',
            },
            {
                position: nextToWalletPosition,
                title: 'Step 1: Add ETH',
                content: (
                    <AddEthOnboardingStep userEthBalanceInWei={this.props.userEtherBalanceInWei || new BigNumber(0)} />
                ),
                continueButtonDisplay: this._userHasVisibleEth() ? 'enabled' : 'disabled',
            },
            {
                position: nextToWalletPosition,
                title: 'Step 2: Wrap ETH',
                content: <WrapEthOnboardingStep1 />,
                continueButtonDisplay: 'enabled',
            },
            {
                position: nextToWalletPosition,
                title: 'Step 2: Wrap ETH',
                content: <WrapEthOnboardingStep2 />,
                continueButtonDisplay: this._userHasVisibleWeth() ? 'enabled' : 'disabled',
            },
            {
                position: nextToWalletPosition,
                title: 'Step 2: Wrap ETH',
                content: <WrapEthOnboardingStep3 wethAmount={this._getWethBalance()} />,
                continueButtonDisplay: this._userHasVisibleWeth() ? 'enabled' : 'disabled',
            },
            {
                position: nextToWalletPosition,
                title: 'Step 3: Unlock Tokens',
                content: (
                    <SetAllowancesOnboardingStep
                        zrxAllowanceToggle={this._renderZrxAllowanceStateToggle()}
                        ethAllowanceToggle={this._renderEthAllowanceStateToggle()}
                        doesUserHaveAllowancesForWethAndZrx={this._doesUserHaveAllowancesForWethAndZrx()}
                    />
                ),
                continueButtonDisplay: this._doesUserHaveAllowancesForWethAndZrx() ? 'enabled' : 'disabled',
            },
            {
                position: nextToWalletPosition,
                title: '🎉  The Ecosystem Awaits',
                content: <CongratsOnboardingStep />,
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
    private _userHasVisibleWeth(): boolean {
        return this._getWethBalance() > new BigNumber(0);
    }
    private _doesUserHaveAllowancesForWethAndZrx(): boolean {
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
            (this.props.stepIndex === 0 && !this.props.isRunning && this.props.blockchainIsLoaded) ||
            (!this.props.isRunning && !this.props.hasBeenClosed && this.props.blockchainIsLoaded)
        ) {
            analytics.track('Onboarding Started', {
                reason: 'automatic',
                stepIndex: this.props.stepIndex,
            });
            this.props.updateIsRunning(true);
        }
    }
    private _updateOnboardingStep(stepIndex: number): void {
        this.props.updateOnboardingStep(stepIndex);
        analytics.track('Update Onboarding Step', {
            stepIndex,
        });
    }
    private _closeOnboarding(): void {
        this.props.updateIsRunning(false);
        analytics.track('Onboarding Closed', {
            stepIndex: this.props.stepIndex,
        });
    }
    private _renderZrxAllowanceStateToggle(): React.ReactNode {
        const zrxToken = utils.getZrxToken(this.props.tokenByAddress);
        return this._renderAllowanceStateToggle(zrxToken);
    }
    private _renderEthAllowanceStateToggle(): React.ReactNode {
        const ethToken = utils.getEthToken(this.props.tokenByAddress);
        return this._renderAllowanceStateToggle(ethToken);
    }
    private _renderAllowanceStateToggle(token: Token): React.ReactNode {
        if (!token) {
            return null;
        }
        const tokenStateIfExists = this.props.trackedTokenStateByAddress[token.address];
        if (_.isUndefined(tokenStateIfExists)) {
            return null;
        }
        return (
            <AllowanceStateToggle
                token={token}
                tokenState={tokenStateIfExists}
                blockchain={this.props.blockchain}
                // tslint:disable-next-line:jsx-no-lambda
                refetchTokenStateAsync={async () => this.props.refetchTokenStateAsync(token.address)}
            />
        );
    }
    private _handleFinalStepContinueClick(): void {
        if (utils.isMobileWidth(this.props.screenWidth)) {
            window.scrollTo(0, 0);
            this.props.history.push('/portal');
        }
        this._closeOnboarding();
    }
}

export const PortalOnboardingFlow = withRouter(PlainPortalOnboardingFlow);
