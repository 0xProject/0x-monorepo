import { colors } from '@0xproject/react-shared';
import ActionAccountBalanceWallet from 'material-ui/svg-icons/action/account-balance-wallet';
import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';

export interface InstallWalletOnboardingStepProps {}

export const InstallWalletOnboardingStep: React.StatelessComponent<InstallWalletOnboardingStepProps> = () => (
    <div className="flex items-center flex-column">
        <Text>
            Before you begin, you need to connect to a wallet. This will be used across all 0x relayers and dApps.
        </Text>
        <Container marginTop="15px" marginBottom="15px">
            <ActionAccountBalanceWallet style={{ width: '50px', height: '50px' }} color={colors.orange} />
        </Container>
        <Text>Please refresh the page once you've done this to continue!</Text>
    </div>
);
