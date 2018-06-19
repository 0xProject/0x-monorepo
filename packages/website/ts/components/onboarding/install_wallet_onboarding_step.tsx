import { colors } from '@0xproject/react-shared';
import ActionAccountBalanceWallet from 'material-ui/svg-icons/action/account-balance-wallet';
import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';

export interface InstallWalletOnboardingStepProps {}

export const InstallWalletOnboardingStep: React.StatelessComponent<InstallWalletOnboardingStepProps> = () => (
    <div className="flex items-center flex-column">
        <Container marginTop="15px" marginBottom="15px">
            <ActionAccountBalanceWallet style={{ width: '30px', height: '30px' }} color={colors.orange} />
        </Container>
        <Text>
            Before you begin, you need to connect to a wallet. This will be used across all 0x relayers and dApps.
        </Text>
    </div>
);
