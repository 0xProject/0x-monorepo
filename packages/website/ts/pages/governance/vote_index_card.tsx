import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';
import styled from 'styled-components';

import { Column, FlexWrap, Section } from 'ts/components/newLayout';
import { Heading, Paragraph } from 'ts/components/text';
import { getTotalBalancesString } from 'ts/pages/governance/vote_stats';
import { VoteStatusText } from 'ts/pages/governance/vote_status_text';
import { TallyInterface, VoteOutcome, VoteTime } from 'ts/types';

export interface VoteIndexCardProps {
    title: string;
    zeipId: number;
    summary: string;
    voteStartDate: moment.Moment;
    voteEndDate: moment.Moment;
    // Non-static properties
    tally?: TallyInterface;
}

const getVoteTime = (voteStartDate: moment.Moment, voteEndDate: moment.Moment): VoteTime | undefined => {
    const now = moment();
    if (now.isBefore(voteEndDate) && now.isAfter(voteStartDate)) {
        return 'happening';
    }
    if (now.isBefore(voteStartDate)) {
        return 'upcoming';
    }
    return undefined;
};

const getVoteOutcome = (tally?: TallyInterface): VoteOutcome | undefined => {
    if (!tally) {
        return undefined;
    }
    if (tally.no.isGreaterThanOrEqualTo(tally.yes)) {
        return 'rejected';
    } else if (tally.yes.isGreaterThan(tally.no)) {
        return 'accepted';
    }
    return undefined;
};

const getDateString = (voteStartDate: moment.Moment, voteEndDate: moment.Moment): string => {
    const voteTime = getVoteTime(voteStartDate, voteEndDate);
    const pstOffset = '-0800';
    const endDate = voteEndDate.utcOffset(pstOffset);
    const startDate = voteStartDate.utcOffset(pstOffset);
    if (voteTime === 'happening') {
        return `Ends ${endDate.format('MMMM Do YYYY, h:mm a')} PST`;
    }
    if (voteTime === 'upcoming') {
        return `Starting ${startDate.format('MMMM Do YYYY, h:mm a')} PST`;
    }
    return `Ended ${endDate.format('MMMM Do YYYY')}`;
};

export const VoteIndexCard: React.StatelessComponent<VoteIndexCardProps> = ({
    title,
    zeipId,
    summary,
    voteStartDate,
    voteEndDate,
    tally,
}) => {
    const voteTime = getVoteTime(voteStartDate, voteEndDate);
    const voteStatus = voteTime || getVoteOutcome(tally);
    const totalBalances = getTotalBalancesString(tally);
    const isPastProposal = voteTime === undefined;
    return (
        <ReactRouterLink to={`/vote/zeip-${zeipId}`}>
            <Section
                hasBorder={isPastProposal}
                bgColor={!isPastProposal ? 'dark' : 'none'}
                padding="60px 30px 40px"
                hasHover={true}
                margin="30px auto"
                maxWidth="100%"
            >
                <FlexWrap>
                    <Column width="60%" padding="0px 20px 0px 0px">
                        <Heading>
                            {`${title} `}
                            <Muted>{`(ZEIP-${zeipId})`}</Muted>
                        </Heading>

                        <Paragraph>{summary}</Paragraph>
                    </Column>
                    <Column>
                        <div className="flex flex-column items-end">
                            <VoteStatusText status={voteStatus} />
                            <Paragraph marginBottom="12px" isMuted={1}>{`${totalBalances} ZRX Total Vote`}</Paragraph>
                            <Paragraph marginBottom="12px">{getDateString(voteStartDate, voteEndDate)}</Paragraph>
                        </div>
                    </Column>
                </FlexWrap>
            </Section>
        </ReactRouterLink>
    );
};

const Muted = styled.span`
    opacity: 0.6;
`;
