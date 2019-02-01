import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';

export interface SetAllowancesOnboardingStepProps {
    zrxAllowanceToggle: React.ReactNode;
    ethAllowanceToggle: React.ReactNode;
    doesUserHaveAllowancesForWethAndZrx: boolean;
}

export const SetAllowancesOnboardingStep: React.StatelessComponent<SetAllowancesOnboardingStepProps> = ({
    ethAllowanceToggle,
    zrxAllowanceToggle,
    doesUserHaveAllowancesForWethAndZrx,
}) => (
    <div className="flex items-center flex-column">
        <Text>Unlock your tokens for trading. You only need to do this once for each token.</Text>
        <Container width="100%" marginTop="25px" marginBottom="15px" className="flex justify-around">
            <div className="flex flex-column items-center">
                <Text fontWeight={700}> Enable WETH </Text>
                <Container marginTop="10px">{ethAllowanceToggle}</Container>
            </div>
            <div className="flex flex-column items-center">
                <Text fontWeight={700}> Enable ZRX </Text>
                <Container marginTop="10px">{zrxAllowanceToggle}</Container>
            </div>
        </Container>
        {doesUserHaveAllowancesForWethAndZrx && <Text>Perfect! Both your ZRX and WETH tokens are unlocked.</Text>}
    </div>
);
