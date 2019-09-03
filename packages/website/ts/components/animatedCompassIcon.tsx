import * as React from 'react';
import styled, { keyframes } from 'styled-components';

export const AnimatedCompassIcon = () => (
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <circle cx="75" cy="75" r="73" stroke="#00AE99" strokeWidth="3" />
            <circle cx="75" cy="75" r="58" stroke="#00AE99" strokeWidth="3" />
            <Needle
                d="M62.9792 62.9792L36.6447 113.355L87.0208 87.0208M62.9792 62.9792L113.355 36.6447L87.0208 87.0208M62.9792 62.9792L87.0208 87.0208"
                stroke="#00AE99"
                strokeWidth="3"
            />

            <Dial>
                <path d="M75 2V17M75 133V148" stroke="#00AE99" strokeWidth="3" />
                <path d="M2 75L17 75M133 75L148 75" stroke="#00AE99" strokeWidth="3" />
                <path d="M11.7801 38.5L24.7705 46M125.229 104L138.22 111.5" stroke="#00AE99" strokeWidth="3" />
                <path d="M38.5001 11.7801L46.0001 24.7705M104 125.229L111.5 138.22" stroke="#00AE99" strokeWidth="3" />
                <path d="M111.5 11.7801L104 24.7705M46 125.229L38.5 138.22" stroke="#00AE99" strokeWidth="3" />
                <path d="M138.22 38.5L125.229 46M24.7705 104L11.7801 111.5" stroke="#00AE99" strokeWidth="3" />
            </Dial>
        </g>
    </svg>
);

const point = keyframes`
    0% { transform: rotate(0deg) }
    20% { transform: rotate(10deg) }
    30% { transform: rotate(30deg) }
    60% { transform: rotate(-20deg) }
    80% { transform: rotate(-20deg) }
    100% { transform: rotate(0deg) }
`;

const rotate = keyframes`
    0% { transform: rotate(0deg) }
    20% { transform: rotate(-10deg) }
    30% { transform: rotate(-30deg) }
    60% { transform: rotate(20deg) }
    80% { transform: rotate(20deg) }
    100% { transform: rotate(0deg) }
`;

const Needle = styled.path`
    animation: ${point} 5s infinite;
    transform-origin: 50% 50%;
`;

const Dial = styled.g`
    animation: ${rotate} 5s infinite;
    transform-origin: 50% 50%;
`;
