import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import styled from 'styled-components';

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
    const totalBalance = Web3Wrapper.toUnitAmount(tally.totalBalance, 18).toFormat(0, 2);

    return (
        <>
            <Heading asElement="h3" size="small" marginBottom="10px">
                Results
            </Heading>
            <VoteBar label="Yes" color={colors.brandLight} percentage={tally.yesPercentage} />
            <VoteBar label="No" color={colors.brandDark} percentage={tally.noPercentage} marginBottom="24px" />
            <Paragraph marginBottom="24px">({totalBalance} ZRX total vote)</Paragraph>
        </>
    );
};
