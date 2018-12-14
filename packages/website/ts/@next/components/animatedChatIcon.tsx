import * as React from 'react';
import styled, { keyframes } from 'styled-components';

export const AnimatedChatIcon = () => (
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75" cy="75" r="73" stroke="#00AE99" stroke-width="3"/>
        <path d="M76 37H137.5" stroke="#00AE99" stroke-width="3"/>
        <path d="M37 73.5L37 12M113 137.5L113 75" stroke="#00AE99" stroke-width="3"/>
        <path d="M13 113H71.5" stroke="#00AE99" stroke-width="3"/>
        <path d="M49.087 47.5264L92.574 4.03932" stroke="#00AE99" stroke-width="3"/>
        <path d="M47.3192 100.913L3.8321 57.4259M146.314 92.4277L102.12 48.2335" stroke="#00AE99" stroke-width="3"/>
        <path d="M58.2793 145.814L101.766 102.327" stroke="#00AE99" stroke-width="3"/>
        <Bubble>
            <path vector-effect="non-scaling-stroke" d="M113 75C113 85.3064 108.897 94.6546 102.235 101.5C98.4048 105.436 71 132.5 71 132.5V112.792C51.8933 110.793 37 94.6359 37 75C37 54.0132 54.0132 37 75 37C95.9868 37 113 54.0132 113 75Z" stroke="#00AE99" strokeWidth="3"/>
            <Dot delay={0} vector-effect="non-scaling-stroke" cx="75" cy="75" r="4" stroke="#00AE99" strokeWidth="3"/>
            <Dot delay={5.6} vector-effect="non-scaling-stroke" cx="91" cy="75" r="4" stroke="#00AE99" strokeWidth="3"/>
            <Dot delay={-5.8} vector-effect="non-scaling-stroke" cx="59" cy="75" r="4" stroke="#00AE99" strokeWidth="3"/>
        </Bubble>
    </svg>
);

const scale = keyframes`
    0% { transform: scale(1.2) }
    20% { transform: scale(1) }
    80% { transform: scale(1) }
    100% { transform: scale(1.2) }
`;

const fadeInOut = keyframes`
    0%, 50%, 54%, 100% {
        transform: initial;
    }

    25% {
        transform: translateY(-5px);
    }
`;

const Bubble = styled.g`
    animation: ${scale} 5s infinite cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform-origin: 50% 50%;

    path,
    circle {
        fill: ${props => props.theme.lightBgColor};
    }
`;

const Dot = styled.circle<{ delay: number }>`
    animation: ${fadeInOut} 5s ${props => `${props.delay}s`} infinite;
`;
