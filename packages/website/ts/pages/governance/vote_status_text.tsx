import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { VoteStatus } from 'ts/types';

const checkColor = '#00AE99';
const renderCheck = (width: number = 18) => (
    <svg width={width} viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 1L6 12L1 7" stroke={checkColor} strokeWidth="1.4" />
    </svg>
);

const clockColor = '#EECE29';
const renderClock = (width: number = 18) => (
    <svg width={width} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="9" r="8" stroke={clockColor} strokeWidth="0.75" />
        <line x1="8.08838" y1="4.76465" x2="8.08838" y2="10.4117" stroke={clockColor} />
        <line x1="13.2354" y1="9.9707" x2="7.58829" y2="9.9707" stroke={clockColor} />
    </svg>
);

const crossColor = '#D34F4F';
const renderCross = (width: number = 14) => (
    <svg width={width} viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.50551 6.99961L0 12.5051L0.989949 13.4951L6.49546 7.98956L12.001 13.4951L12.9909 12.5051L7.48541 6.99961L12.99 1.49508L12 0.505127L6.49546 6.00966L0.990926 0.505127L0.0009767 1.49508L5.50551 6.99961Z"
            fill={crossColor}
        />
    </svg>
);

export interface VoteStatusTextProps {
    status: VoteStatus;
}

export const VoteStatusText: React.StatelessComponent<VoteStatusTextProps> = ({ status }) => {
    switch (status) {
        case 'upcoming':
            return (
                <VoteStatusTextBase color={clockColor}>
                    <span>{renderClock()}</span>
                    Upcoming
                </VoteStatusTextBase>
            );
        case 'accepted':
            return (
                <VoteStatusTextBase color={checkColor}>
                    <span>{renderCheck()}</span>
                    Accepted
                </VoteStatusTextBase>
            );
        case 'rejected':
            return (
                <VoteStatusTextBase color={crossColor}>
                    <span>{renderCross()}</span>
                    Rejected
                </VoteStatusTextBase>
            );
        case 'happening':
            return (
                <VoteStatusTextBase>
                    <Button isWithArrow={true} isAccentColor={true} fontSize="22px">
                        Vote Now
                    </Button>
                </VoteStatusTextBase>
            );
        default:
            return <VoteStatusTextBase>Loading...</VoteStatusTextBase>;
    }
};

interface VoteStatusTextBaseProps {
    color?: string;
}

const VoteStatusTextBase = styled.div<VoteStatusTextBaseProps>`
    font-size: 22px;
    color: ${props => props.color};
    margin-bottom: 12px;
    span {
        position: relative;
        margin-right: 8px;
        top: 1px;
    }
`;
