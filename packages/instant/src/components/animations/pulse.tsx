import { keyframes, styled } from '../../style/theme';

const pulsingKeyframes = keyframes`
    0%, 100% {
        opacity: 0.2;
    }
    50% {
        opacity: 100;
    }
`;
export const Pulse = styled.div`
    animation-name: ${pulsingKeyframes}
    animation-duration: 2s;
    animation-iteration-count: infinite;
`;
