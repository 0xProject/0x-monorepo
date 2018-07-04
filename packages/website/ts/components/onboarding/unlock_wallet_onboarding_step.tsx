import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';

export interface UnlockWalletOnboardingStepProps {}

export const UnlockWalletOnboardingStep: React.StatelessComponent<UnlockWalletOnboardingStepProps> = () => (
    <div className="flex items-center flex-column">
        <div className="flex items-center flex-column">
            <Container marginTop="15px" marginBottom="15px">
                <img src="/images/metamask_icon.png" height="50px" width="50px" />
            </Container>
            <Text center={true}>Unlock your MetaMask extension to get started.</Text>
        </div>
    </div>
);
