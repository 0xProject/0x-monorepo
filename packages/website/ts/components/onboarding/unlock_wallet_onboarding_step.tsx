import * as React from 'react';
import { Image } from 'ts/components/ui/image';

export interface UnlockWalletOnboardingStepProps {}

export const UnlockWalletOnboardingStep: React.StatelessComponent<UnlockWalletOnboardingStepProps> = () => (
    <Image src="/images/unlock-mm.png" />
);
