import { keyframes, styled } from '../../style/theme';

const rotatingKeyframes = keyframes`
from {
  transform: rotate(0deg);
}

to {
  transform: rotate(360deg);
}
`;

export const FullRotation = styled.div`
    animation: ${rotatingKeyframes} 2s linear infinite;
`;
