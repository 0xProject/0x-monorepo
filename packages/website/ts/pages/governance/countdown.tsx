import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';

import { Paragraph } from 'ts/components/text';

interface Props {
    deadline: number;
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

const now = moment();

export const Countdown: React.StatelessComponent<Props> = ({ deadline }) => {
    const pstOffset = '-0800';
    const time = moment(deadline, 'X').utcOffset(pstOffset);
    const isPassed = time.isBefore(now);
    const voteTextPrefix = isPassed ? `Voting ended: ` : `Vote ends: `;
    const timeText = !isPassed ? ` • ${getRelativeTime(time)}` : '';
    const voteText = `${voteTextPrefix} ${time.format('L LT')} PST ${timeText}`;

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
                <Paragraph isMuted={0.5} style={{ marginRight: '10px' }}>
                    Vote {isPassed ? 'ended' : 'ends'}: {time.format('YYYY/MM/DD h:mm:ss Z')}
                </Paragraph>
            </div>
        </div>
    );
};

function getRelativeTime(deadline: moment.Moment): string {
    const diff = moment().diff(deadline);
    const duration = moment.duration(diff);

    return millisToDaysHoursMinutes(duration.asMilliseconds());
}

function millisToDaysHoursMinutes(futureDateMs: number): string {
    let delta = Math.abs(futureDateMs - now.milliseconds()) / 1000;
    const result: TimeStructure = {};
    const structure: TimeStructure = {
        // year: 31536000,
        // month: 2592000,
        // week: 604800,
        day: 86400,
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
