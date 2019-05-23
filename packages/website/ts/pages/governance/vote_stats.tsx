import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as React from 'react';

import { Heading, Paragraph } from 'ts/components/text';
import { TallyInterface } from 'ts/pages/governance/governance';
import { VoteBar } from 'ts/pages/governance/vote_bar';
import { colors } from 'ts/style/colors';
import { constants } from 'ts/utils/constants';

interface VoteStatsProps {
    tally?: TallyInterface;
}

export const VoteStats: React.StatelessComponent<VoteStatsProps> = ({ tally }) => {
    const bigNumberFormat = {
        decimalSeparator: '.',
        groupSeparator: ',',
        groupSize: 3,
        secondaryGroupSize: 0,
        fractionGroupSeparator: ' ',
        fractionGroupSize: 0,
    };
    const { yes, totalBalance } = tally;
    const HUNDRED = new BigNumber(100);
    const totalBalanceString = Web3Wrapper.toUnitAmount(totalBalance, constants.DECIMAL_PLACES_ETH).toFormat(
        0,
        BigNumber.ROUND_FLOOR,
        bigNumberFormat,
    );
    let yesPercentage = HUNDRED.times(yes.dividedBy(totalBalance));
    let noPercentage = HUNDRED.minus(yesPercentage);

    if (isNaN(yesPercentage.toNumber())) {
        yesPercentage = new BigNumber(0);
    }

    if (isNaN(noPercentage.toNumber())) {
        noPercentage = new BigNumber(0);
    }

    return (
        <>
            <Heading asElement="h3" size="small" marginBottom="10px">
                Results
            </Heading>
            <VoteBar label="Yes" color={colors.brandLight} percentage={yesPercentage} />
            <VoteBar label="No" color={colors.brandDark} percentage={noPercentage} marginBottom="24px" />
            <Paragraph marginBottom="24px">({totalBalanceString} ZRX total vote)</Paragraph>
        </>
    );
};
