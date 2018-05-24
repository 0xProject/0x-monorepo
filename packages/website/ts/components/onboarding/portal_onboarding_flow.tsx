import * as _ from 'lodash';
import * as React from 'react';
import { Step } from 'react-joyride';

import { OnboardingFlow } from 'ts/components/onboarding/onboarding_flow';
import { ProviderType } from 'ts/types';
import { utils } from 'ts/utils/utils';

export interface PortalOnboardingFlowProps {
    stepIndex: number;
    isRunning: boolean;
    onClose: () => void;
    userAddress: string;
    providerType: ProviderType;
    injectedProviderName: string;
    blockchainIsLoaded: boolean;
    setOnboardingStep: (stepIndex: number) => void;
}

export class PortalOnboardingFlow extends React.Component<PortalOnboardingFlowProps> {
    public render(): React.ReactNode {
        return (
            <OnboardingFlow
                steps={this._getSteps()}
                stepIndex={this.props.stepIndex}
                isRunning={this.props.isRunning}
                onClose={this.props.onClose}
            />
        );
    }

    private _isAddressAvailable(): boolean {
        return !_.isEmpty(this.props.userAddress);
    }

    private _getSteps(): Step[] {
        const allSteps: Step[] = [
            {
                target: '.wallet',
                content:
                    'Before you begin, you need to connect to a wallet. This will be used across all 0x relayers and dApps',
                placement: 'right',
                disableBeacon: true,
            },
            {
                target: '.wallet',
                content: 'Unlock your metamask extension to begin',
                placement: 'right',
                disableBeacon: true,
            },
            {
                target: '.wallet',
                content:
                    'In order to start trading on any 0x relayer in the 0x ecosystem, you need to complete two simple steps',
                placement: 'right',
                disableBeacon: true,
            },
        ];
        const [noMetamaskStep, lockedMetamaskStep, ...restOfSteps] = allSteps;
        if (this._isAddressAvailable()) {
            return restOfSteps;
        }
        const isExternallyInjected = utils.isExternallyInjected(
            this.props.providerType,
            this.props.injectedProviderName,
        );
        if (isExternallyInjected) {
            return [lockedMetamaskStep, ...restOfSteps];
        }
        return allSteps;
    }
}
