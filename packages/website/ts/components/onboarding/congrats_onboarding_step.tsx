import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';

export interface CongratsOnboardingStepProps {}

export const CongratsOnboardingStep: React.StatelessComponent<CongratsOnboardingStepProps> = () => (
    <div className="flex items-center flex-column">
        <Text>Your wallet is now set up for trading. Use it on any relayer in the 0x ecosystem.</Text>
        <Container marginTop="25px" marginBottom="15px" className="flex justify-center">
            <img src="/images/zrx_ecosystem.svg" height="150px" />
        </Container>
        <Text>No need to log in. Each relayer automatically detects and connects to your wallet.</Text>
    </div>
);
