import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Heading, Paragraph } from 'ts/components/text';

interface Props {
    deadline: number;
}

const now = moment();

export const Countdown: React.StatelessComponent<Props> = ({ deadline }) => {
    const time = moment(deadline, 'X');
    const isPassed = time.isBefore(now);

    return (
        <div>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
                <Paragraph style={{ marginRight: '10px' }}>Time left to vote</Paragraph>
                <Paragraph color="#AE5300">{isPassed ? 'Voting has ended' : getRelativeTime(time)}</Paragraph>
            </div>
        </div>
    );
};

export const VoteDeadline: React.StatelessComponent<Props> = ({ deadline }) => {
    const time = moment(deadline, 'X');
    const isPassed = time.isBefore(now);

    return (
        <div>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
                <Paragraph style={{ marginRight: '10px' }}>Vote {isPassed ? 'ended' : 'ends'}: {time.format('YYYY/MM/DD h:mm:ss Z')}</Paragraph>
            </div>
        </div>
    );
};

function getRelativeTime(deadline: moment.Moment): string {
    return deadline.fromNow(false);
}
