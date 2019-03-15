import * as React from 'react';
import styled, { keyframes } from 'styled-components';

export const HeroAnimation = () => (
    <Image width="404" height="404" viewBox="0 0 404 404" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="404" height="404">
            <circle cx="202" cy="202" r="200" fill="#00AE99" stroke="#00AE99" strokeWidth="3" />
        </mask>
        <g mask="url(#mask0)">
            <circle cx="202" cy="202" r="200" stroke="#00AE99" strokeWidth="3" />
            <TopCircle
                vectorEffect="non-scaling-stroke"
                cx="201.667"
                cy="68.6667"
                r="66.6667"
                stroke="#00AE99"
                strokeWidth="3"
            />
            <LeftCircle
                vectorEffect="non-scaling-stroke"
                cx="68.6667"
                cy="202.667"
                r="66.6667"
                stroke="#00AE99"
                strokeWidth="3"
            />
            <Logo
                vectorEffect="non-scaling-stroke"
                d="M202.1 270.6c-1.4 0-2.9 0-4.4-.1-10.5-.7-20.4-3.7-29.5-8.9l-1.8-1 42.4-32.3 11.6 11.4.6-.3c6.6-3.4 12.1-8.5 16.1-14.6l1.1-1.6 4.6 5.9c4.2 5.5 8.1 10.7 11.6 15.5l.6.9-.7.8c-4.5 5.3-9.7 9.9-15.6 13.7-10.9 6.9-23.5 10.6-36.6 10.6zm-30.7-10.4l1.4.7c7.8 3.9 16.2 6.2 25 6.8 1.4.1 2.8.1 4.2.1 12.5 0 24.7-3.5 35.1-10.2 5-3.2 9.6-7.1 13.7-11.7l.5-.6-.5-.7c-3.2-4.5-6.7-9.2-10.4-13.9l-2.2-2.8-.8 1c-4.4 5.8-10.2 10.6-16.8 13.7l-.9.4-11.3-11.1-37 28.3zm-13.2-5.5c-5.3-4.5-9.9-9.7-13.7-15.6-7-10.9-10.7-23.6-10.7-36.6 0-1.4 0-2.9.1-4.4.7-10.5 3.7-20.4 8.9-29.5l1-1.8 32.3 42.4-11.4 11.6.3.6c3.4 6.6 8.5 12.1 14.6 16.1l1.6 1.1-5.8 4.6c-5.5 4.2-10.8 8.2-15.6 11.6l-.9.6-.7-.7zm-14.6-81.4c-3.9 7.8-6.2 16.2-6.8 25-.1 1.4-.1 2.8-.1 4.2 0 12.6 3.5 24.7 10.2 35.2 3.2 5 7.1 9.6 11.7 13.7l.6.5.7-.5c4.5-3.2 9.2-6.7 13.9-10.4l2.8-2.2-1-.8c-5.8-4.4-10.6-10.2-13.7-16.9l-.4-.9 11.1-11.3-28.3-37.1-.7 1.5zm84.2 22.4l11.4-11.6-.3-.6c-3.4-6.6-8.5-12.1-14.6-16.1l-1.6-1.1 5.8-4.6c5.5-4.2 10.8-8.2 15.6-11.6l.9-.6.8.7c5.3 4.5 9.9 9.7 13.7 15.6 7 10.9 10.7 23.6 10.7 36.6 0 1.4 0 2.9-.1 4.4-.7 10.5-3.7 20.4-8.9 29.5l-1 1.8-32.4-42.4zm3.7.2l28.3 37.1.7-1.4c3.9-7.8 6.2-16.2 6.8-25 .1-1.4.1-2.8.1-4.2 0-12.5-3.5-24.7-10.2-35.1-3.2-5-7.1-9.6-11.7-13.7l-.6-.5-.7.5c-4.5 3.2-9.2 6.7-13.9 10.4l-2.7 2.2 1 .8c5.8 4.4 10.6 10.2 13.7 16.9l.4.9-11.2 11.1zM161.3 176c-4.2-5.5-8.1-10.8-11.6-15.6l-.6-.9.7-.8c4.5-5.3 9.7-9.9 15.6-13.7 10.9-7 23.6-10.7 36.6-10.7 1.4 0 2.9 0 4.4.1 10.5.7 20.4 3.7 29.5 8.9l1.8 1-42.4 32.3-11.6-11.4-.6.3c-6.6 3.4-12.1 8.5-16.1 14.6l-1.1 1.6-4.6-5.7zm40.6-38.9c-12.5 0-24.7 3.5-35.1 10.2-5 3.2-9.6 7.1-13.7 11.7l-.5.6.5.7c3.2 4.5 6.7 9.2 10.4 13.9l2.2 2.8.8-1c4.4-5.8 10.2-10.6 16.9-13.7l.9-.4 11.3 11.1 37.1-28.3-1.4-.7c-7.8-3.9-16.2-6.2-25-6.8-1.6-.1-3-.1-4.4-.1z"
                fill="#00AE99"
            />
            <Rectangle
                vectorEffect="non-scaling-stroke"
                d="M269 135V268.333H442V135H269Z"
                stroke="#00AE99"
                strokeWidth="3"
            />
            <Square
                vectorEffect="non-scaling-stroke"
                d="M339.64 269.64L270 339.281L343.913 413.194L413.554 343.554L339.64 269.64Z"
                stroke="#00AE99"
                strokeWidth="3"
            />
            <Oblong
                vectorEffect="non-scaling-stroke"
                d="M202.5 269C202.5 269 269 269 269 335.5C269 402 202.5 402 202.5 402H-6.5C-6.5 402 -77 402 -77 335.5C-77 269 -6.5 269 -6.5 269H202.5Z"
                stroke="#00AE99"
                strokeWidth="3"
            />
        </g>
    </Image>
);

const moveUp = keyframes`
    0% { transform: translate3d(0, 0, 0) }
    45% { transform: translate3d(0, 0, 0) }
    55% { transform: translate3d(0, -7%, 0) }
    85% { transform: translate3d(0, -7%, 0) }
    100% { transform: translate3d(0, 0, 0) }
`;

const moveLeft = keyframes`
    0% { transform: translate3d(0, 0, 0) }
    45% { transform: translate3d(0, 0, 0) }
    55% { transform: translate3d(-7%, 0, 0) }
    85% { transform: translate3d(-7%, 0, 0) }
    100% { transform: translate3d(0, 0, 0) }
`;

const moveDiag = keyframes`
    0% { transform: translate3d(0, 0, 0) }
    45% { transform: translate3d(0, 0, 0) }
    55% { transform: translate3d(5%, 5%, 0) }
    85% { transform: translate3d(5%, 5%, 0) }
    100% { transform: translate3d(0, 0, 0) }
`;

const moveRight = keyframes`
    0% { transform: translate3d(0, 0, 0) }
    45% { transform: translate3d(0, 0, 0) }
    55% { transform: translate3d(7%, 0, 0) }
    85% { transform: translate3d(7%, 0, 0) }
    100% { transform: translate3d(0, 0, 0) }
`;

const spin = keyframes`
    0% { transform: rotate(0deg) }
    65% { transform: rotate(0deg) }
    85% { transform: rotate(90deg) }
    100% { transform: rotate(90deg) }
`;

const moveIn = keyframes`
    0% { opacity: 0; transform: scale(1.7) rotate(-30deg) }
    100% { opacity: 1; transform: scale(1)  rotate(0deg) }
`;

const Image = styled.svg`
    opacity: 0;
    transform: scale(1.5) rotate(-30deg);
    animation: ${moveIn} 2s forwards;
`;

const TopCircle = styled.circle`
    animation: ${moveUp} 4s -2.85s infinite;
`;
const LeftCircle = styled.circle`
    animation: ${moveLeft} 4s -2.85s infinite;
`;
const Oblong = styled.path`
    animation: ${moveLeft} 4s -2.85s infinite;
`;
const Square = styled.path`
    animation: ${moveDiag} 4s -2.85s infinite;
`;
const Rectangle = styled.path`
    animation: ${moveRight} 4s -2.85s infinite;
`;

const Logo = styled.path`
    animation: ${spin} 4s -2.8s infinite;
    transform-origin: 202px 202.5px;
`;
