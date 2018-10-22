import { keyframes, styled } from '../../style/theme';

interface FullRotationProps {
    height: string;
    width: string;
}
const rotatingKeyframes = keyframes`
from {
  transform: rotate(0deg);
}

to {
  transform: rotate(360deg);
}
`;

export const FullRotation =
    styled.div <
    FullRotationProps >
    `
    animation: ${rotatingKeyframes} 2s linear infinite;
    height: ${props => props.height};
    width: ${props => props.width};
`;
