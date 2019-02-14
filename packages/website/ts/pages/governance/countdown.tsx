import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';

import { number } from 'prop-types';
import { Paragraph } from 'ts/components/text';

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
                <Paragraph style={{ marginRight: '10px' }}>
                    Vote {isPassed ? 'ended' : 'ends'}: {time.format('YYYY/MM/DD h:mm:ss Z')}
                </Paragraph>
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

interface TimeStructure {
    year?: number;
    month?: number;
    week?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    [key: string]: number;
}

function millisToDaysHoursMinutes(futureDateMs: number): string {
    let delta = Math.abs(futureDateMs - now.milliseconds()) / 1000;                           // delta
    const result: TimeStructure = {};                                                                // result
    const structure: TimeStructure = {                                                                  // structure
        // year: 31536000,
        // month: 2592000,
        // week: 604800, // uncomment row to ignore
        day: 86400,   // feel free to add your own row
        hour: 3600,
        minute: 60,
        second: 1,
    };

    _.keys(structure).forEach((key: string) => {
        result[key] = Math.floor(delta / structure[key]);
        delta -= result[key] * structure[key];
    });

    return `${result.day} days ${result.hour} hours ${result.minute} mins`;
}
