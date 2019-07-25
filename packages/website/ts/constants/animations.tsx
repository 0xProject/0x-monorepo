import { css, keyframes } from 'styled-components';

const fadeInUp = keyframes`
    0% {
        transform: translateY(10px);
        opacity: 0;
    }
    100% {
        transform: translateY(0);
        opacity: 1;
    }
`;

export const addFadeInAnimation = (duration: string = '0.5s', delay: string = '0s') => css`
    opacity: 0;
    transform: translateY(10px);
    animation: ${fadeInUp} ${duration} ${delay} forwards;
`;
