import * as _ from 'lodash';
import * as React from 'react';

import { TallyInterface } from 'ts/pages/governance/governance';

import { Heading, Paragraph } from 'ts/components/text';
import { VoteBar } from 'ts/pages/governance/vote_bar';

import { colors } from 'ts/style/colors';

import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

interface VoteStatsProps {
    tally?: TallyInterface;
}
export const VoteStats: React.StatelessComponent<VoteStatsProps> = ({ tally }) => {
    BigNumber.config({
        FORMAT: {
            decimalSeparator: '.',
            groupSeparator: ',',
            groupSize: 3,
            secondaryGroupSize: 0,
            fractionGroupSeparator: ' ',
            fractionGroupSize: 0,
        },
    });
    // const totalBalance = tally.totalBalance.toFormat(3, 2);
    const { yes, totalBalance } = tally;
    const HUNDRED = new BigNumber(100);
    const totalBalanceString = Web3Wrapper.toUnitAmount(totalBalance, 18).toFormat(0, 2);
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
            <VoteBar label="Yes" color={colors.brandLight} percentage={yesPercentage.toFixed(0)} />
            <VoteBar label="No" color={colors.brandDark} percentage={noPercentage.toFixed(0)} marginBottom="24px" />
            <Paragraph marginBottom="24px">({totalBalanceString} ZRX total vote)</Paragraph>
        </>
    );
};
