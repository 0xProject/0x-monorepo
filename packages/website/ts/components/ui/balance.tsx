import { BigNumber } from '@0x/utils';
import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { utils } from 'ts/utils/utils';

export interface BalanceProps {
    amount: BigNumber;
    decimals: number;
    symbol: string;
}

export const Balance: React.StatelessComponent<BalanceProps> = ({ amount, decimals, symbol }) => {
    const formattedAmout = utils.getFormattedAmount(amount, decimals);
    return (
        <span>
            <Text Tag="span" fontSize="16px" fontWeight="700" lineHeight="1em">
                {formattedAmout}
            </Text>
            <Container marginLeft="0.3em" Tag="span">
                <Text Tag="span" fontSize="12px" fontWeight="700" lineHeight="1em">
                    {symbol}
                </Text>
            </Container>
        </span>
    );
};
