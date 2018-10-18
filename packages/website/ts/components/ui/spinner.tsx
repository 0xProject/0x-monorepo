import { colors } from '@0x/react-shared';
import * as React from 'react';
import { styled } from 'ts/style/theme';

import { dash, rotate } from 'ts/style/keyframes';

interface SpinnerSvgProps {
    color: string;
    size: number;
    viewBox?: string;
}

const SpinnerSvg: React.StatelessComponent<SpinnerSvgProps> = props => <svg {...props} />;

const StyledSpinner = styled(SpinnerSvg)`
    animation: ${rotate} 3s linear infinite;
    margin: ${props => `-${props.size / 2}px 0 0 -${props.size / 2}px`};
    margin-top: ${props => `-${props.size / 2}px`};
    margin-left: ${props => `-${props.size / 2}px`};
    margin-bottom: 0px;
    margin-right: 0px;
    size: ${props => `${props.size}px`};
    height: ${props => `${props.size}px`};

    & .path {
        stroke: ${props => props.color};
        stroke-linecap: round;
        animation: ${dash} 2.5s ease-in-out infinite;
    }
`;

export interface SpinnerProps {
    size?: number;
    strokeSize?: number;
    color?: string;
}

export const Spinner: React.StatelessComponent<SpinnerProps> = ({ size, strokeSize, color }) => {
    const c = size / 2;
    const r = c - strokeSize;
    return (
        <StyledSpinner color={color} size={size} viewBox={`0 0 ${size} ${size}`}>
            <circle className="path" cx={c} cy={c} r={r} fill="none" strokeWidth={strokeSize} />
        </StyledSpinner>
    );
};

Spinner.defaultProps = {
    size: 50,
    color: colors.mediumBlue,
    strokeSize: 4,
};

Spinner.displayName = 'Spinner';
