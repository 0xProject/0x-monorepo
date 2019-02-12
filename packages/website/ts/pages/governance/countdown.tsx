import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import styled from 'styled-components';
require('moment-precise-range-plugin');

import { colors } from 'ts/style/colors';

import { Heading, Paragraph } from 'ts/components/text';

interface Props {
    deadline: number;
}

const now = moment();

export const Countdown: React.StatelessComponent<Props> = ({ deadline }) => {
    const time = moment(deadline, 'X');
    const isPassed = time.isBefore(now);
    const voteTextPrefix = isPassed ? `Voting ended: ` : `Vote ends: `;
    const timeText = !isPassed ? ` • ${getRelativeTime(time)}` : '';
    const voteText = `${voteTextPrefix}: ${time.format('YYYY/MM/DD h:mm:ss Z')}${timeText}`;

    return (
        <div>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
                <Paragraph style={{ marginRight: '10px' }}>{voteText} </Paragraph>
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
    const parts = [];
    const diff = moment().diff(deadline);
    const duration = moment.duration(diff);
    const days = duration.asDays();
    const hours = duration.asHours();
    const minutes = duration.asMinutes();

    // @todo: how to apply correct timezone?
    // ${time.format('YYYY/MM/DD h:mm:ss Z')}

    // debugger;

    if (days > 0) {
        parts.push(`${days} days`);
    }

    if (hours > 0) {
        parts.push(`${hours} hours`);
    }

    if (minutes > 0) {
        parts.push(`${minutes} mins`);
    }

    return millisToDaysHoursMinutes(duration.asMilliseconds());
}

function pad(numberToPad: number): string {
    let result = `${numberToPad}`;

    if (result.length < 2) {
        result = `0${result}`;
    }

    return result;
}

function millisToDaysHoursMinutes(ms: number): string {
    const minutesPerDay = 60 * 24;
    const seconds = ms / 1000;
    let totalMinutes = seconds / 60;

    const days = totalMinutes / minutesPerDay;
    totalMinutes -= minutesPerDay * days;
    const hours = totalMinutes / 60;
    totalMinutes -= hours * 60;

    return `${days} days ${pad(hours)} hours ${pad(totalMinutes)} mins`;
}