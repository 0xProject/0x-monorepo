import * as _ from 'lodash';
import * as React from 'react';

import { BigNumber } from '@0xproject/utils';
import { OnboardingFlow, Step } from 'ts/components/onboarding/onboarding_flow';
import { ProviderType, TokenByAddress, TokenStateByAddress } from 'ts/types';
import { utils } from 'ts/utils/utils';

export interface PortalOnboardingFlowProps {
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
                continueButtonDisplay: this._userHasEth() ? 'enabled' : 'disabled',
            },
            {
                target: '.weth-row',
                content: 'You need to convert some of your ETH into tradeable Wrapped ETH (WETH)',
                placement: 'right',
                continueButtonDisplay: this._userHasWeth() ? 'enabled' : 'disabled',
            },
        ];
        return steps;
    }

    private _isAddressAvailable(): boolean {
        return !_.isEmpty(this.props.userAddress);
    }

    private _userHasEth(): boolean {
        return this.props.userEtherBalanceInWei > new BigNumber(0);
    }

    private _userHasWeth(): boolean {
        const ethToken = utils.getEthToken(this.props.tokenByAddress);
        if (!ethToken) {
            return false;
        }
        const wethTokenState = this.props.trackedTokenStateByAddress[ethToken.address];
        return wethTokenState.balance > new BigNumber(0);
    }

    private _overrideOnboardingStateIfShould(): void {
        this._autoStartOnboardingIfShould();
        this._adjustStepIfShould();
    }

    private _adjustStepIfShould(): void {
        if (this._isAddressAvailable()) {
            if (this.props.stepIndex < 2) {
                this.props.updateOnboardingStep(2);
            }
            return;
        }
        const isExternallyInjected = utils.isExternallyInjected(
            this.props.providerType,
            this.props.injectedProviderName,
        );
        if (isExternallyInjected) {
            this.props.updateOnboardingStep(1);
            return;
        }
        this.props.updateOnboardingStep(0);
    }
    private _autoStartOnboardingIfShould(): void {
        if (!this.props.isRunning && !this.props.hasBeenSeen && this.props.blockchainIsLoaded) {
            this.props.updateIsRunning(true);
        }
    }
}
