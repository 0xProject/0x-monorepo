import * as React from 'react';

import { Circle } from 'ts/components/ui/circle';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { AccountState } from 'ts/types';

export interface AccountConnectionProps {
    accountState: AccountState;
    injectedProviderName: string;
}

export const AccountConnection: React.StatelessComponent<AccountConnectionProps> = ({
    accountState,
    injectedProviderName,
}) => {
    return (
        <Container className="flex items-center">
            <Circle diameter={6} fillColor={getInjectedProviderColor(accountState)} />
            <Container marginLeft="6px">
                <Text fontSize="12px" lineHeight="14px" fontColor={colors.darkGrey}>
                    {injectedProviderName}
                </Text>
            </Container>
        </Container>
    );
};

const getInjectedProviderColor = (accountState: AccountState) => {
    switch (accountState) {
        case AccountState.Ready:
            return colors.limeGreen;
        case AccountState.Locked:
        case AccountState.Loading:
        case AccountState.Disconnected:
        default:
            return colors.red;
    }
};
