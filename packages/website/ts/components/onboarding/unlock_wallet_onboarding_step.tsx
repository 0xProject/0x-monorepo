import * as React from 'react';
import { Image } from 'ts/components/ui/image';

export interface UnlockWalletOnboardingStepProps {}

export const UnlockWalletOnboardingStep: React.StatelessComponent<UnlockWalletOnboardingStepProps> = () => (
    <div className="flex items-center flex-column">
        <div className="flex items-center flex-column">
            <Image src="/images/unlock-mm.png" />
        </div>
    </div>
);
