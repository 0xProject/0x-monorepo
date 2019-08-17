import * as React from 'react';
import { styled } from 'ts/style/theme';
import { colors } from 'ts/utils/colors';

export enum PointerDirection {
    Top = 'top',
    Right = 'right',
    Bottom = 'bottom',
    Left = 'left',
}

export interface PointerProps {
    className?: string;
    color?: string;
    size?: number;
    direction: PointerDirection;
}

const PlainPointer: React.StatelessComponent<PointerProps> = props => <div {...props} />;

const positionToCss = (props: PointerProps) => {
    const position = {
        top: `bottom: 100%; left: 50%;`,
        right: `left: 100%; top: 50%;`,
        bottom: `top: 100%; left: 50%;`,
        left: `right: 100%; top: 50%;`,
    }[props.direction];

    const borderColorSide = {
        top: 'border-bottom-color',
        right: 'border-left-color',
        bottom: 'border-top-color',
        left: 'border-right-color',
    }[props.direction];
    const border = `${borderColorSide}: ${props.color};`;
    const marginSide = {
        top: 'margin-left',
        right: 'margin-top',
        bottom: 'margin-left',
        left: 'margin-top',
    }[props.direction];
    const margin = `${marginSide}: -${props.size}px`;
    return {
        position,
        border,
        margin,
    };
};

export const Pointer = styled(PlainPointer)`
    position: relative;
    &:after {
        border: solid transparent;
        content: " ";
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
        border-color: rgba(136, 183, 213, 0);
        border-width: ${props => `${props.size}px`};
        ${props => positionToCss(props).position}
        ${props => positionToCss(props).border}
        ${props => positionToCss(props).margin}
    }
`;

Pointer.defaultProps = {
    color: colors.white,
    size: 16,
};

Pointer.displayName = 'Pointer';
