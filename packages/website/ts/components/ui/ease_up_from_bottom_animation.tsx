import { css, keyframes, styled } from 'ts/style/theme';

const appearFromBottomFrames = keyframes`
    from {
        position: fixed;
        bottom: -500px;
        left: 0px;
        right: 0px;
    }

    to {
        position: fixed;
        bottom: 0px;
        left: 0px;
        right: 0px;
    }
`;

const stylesForAnimation = css`
    position: fixed;
`;
const animations = css`
    animation: ${appearFromBottomFrames} 1s ease 0s 1 forwards;
`;

export const EaseUpFromBottomAnimation = styled.div`
    ${props => animations};
    ${props => stylesForAnimation};
`;

EaseUpFromBottomAnimation.displayName = 'EaseUpFromBottomAnimation';
