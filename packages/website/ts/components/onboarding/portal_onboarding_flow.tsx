import * as _ from 'lodash';
import * as React from 'react';

import { black } from 'material-ui/styles/colors';
import { OnboardingFlow, Step } from 'ts/components/onboarding/onboarding_flow';
import { ProviderType } from 'ts/types';
import { utils } from 'ts/utils/utils';

export interface PortalOnboardingFlowProps {
    stepIndex: number;
    isRunning: boolean;
    userAddress: string;
    providerType: ProviderType;
    injectedProviderName: string;
    blockchainIsLoaded: boolean;
    hasBeenSeen: boolean;
    setIsRunning: (isRunning: boolean) => void;
    setOnboardingStep: (stepIndex: number) => void;
}

const steps: Step[] = [
    {
        target: '.wallet',
        content:
            'Before you begin, you need to connect to a wallet. This will be used across all 0x relayers and dApps',
        placement: 'right',
    },
    {
        target: '.wallet',
        content: 'Unlock your metamask extension to begin',
        placement: 'right',
    },
    {
        target: '.wallet',
        content:
            'In order to start trading on any 0x relayer in the 0x ecosystem, you need to complete two simple steps',
        placement: 'right',
    },
    {
        target: '.wallet',
        content: 'Before you begin you will need to send some ETH to your metamask wallet',
        placement: 'right',
    },
];

export class PortalOnboardingFlow extends React.Component<PortalOnboardingFlowProps> {
    public componentDidMount(): void {
        this._autoStartOnboardingIfShould();
    }
    public componentDidUpdate(): void {
        this._autoStartOnboardingIfShould();
    }
    public render(): React.ReactNode {
        return (
            <OnboardingFlow
                steps={steps}
                blacklistedStepIndices={this._getBlacklistedStepIndices()}
                stepIndex={this.props.stepIndex}
                isRunning={this.props.isRunning}
                onClose={this.props.setIsRunning.bind(this, false)}
                setOnboardingStep={this.props.setOnboardingStep}
            />
        );
    }

    private _isAddressAvailable(): boolean {
        return !_.isEmpty(this.props.userAddress);
    }

    private _getBlacklistedStepIndices(): number[] {
        if (this._isAddressAvailable()) {
            return [0, 1];
        }
        const isExternallyInjected = utils.isExternallyInjected(
            this.props.providerType,
            this.props.injectedProviderName,
        );
        const twoAndOn = _.range(2, steps.length);
        if (isExternallyInjected) {
            return [0].concat(twoAndOn);
        }
        return twoAndOn;
    }

    private _autoStartOnboardingIfShould(): void {
        if (!this.props.isRunning && !this.props.hasBeenSeen && this.props.blockchainIsLoaded) {
            this.props.setIsRunning(true);
        }
    }
}
