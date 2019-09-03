import * as React from 'react';
import styled from 'styled-components';

import { getCSSPadding, PaddingInterface } from 'ts/constants/utilities';
import { colors } from 'ts/style/colors';

interface IconProps extends PaddingInterface {
    color?: string;
    name?: string;
    component?: React.ReactNode;
    size?: 'small' | 'medium' | 'large' | 'hero' | 'natural' | number;
}

export const Icon: React.FC<IconProps> = props => {
    if (props.name && !props.component) {
        const IconSVG = React.lazy(async () =>
            import(/* webpackChunkName: "icon" */ `ts/icons/illustrations/${props.name}.svg`),
        );

        return (
            <StyledIcon {...props}>
                <React.Suspense fallback={<React.Fragment />}>
                    <IconSVG />
                </React.Suspense>
            </StyledIcon>
        );
    }

    if (props.component) {
        return <StyledIcon {...props}>{props.component}</StyledIcon>;
    }

    return null;
};

Icon.defaultProps = {
    color: colors.brandLight,
};

export const InlineIconWrap = styled.div<PaddingInterface>`
    margin: ${props => getCSSPadding(props.margin)};
    display: flex;
    align-items: center;
    justify-content: center;

    > figure {
        margin: 0 5px;
    }
`;

const _getSize = (size: string | number = 'small'): string | undefined => {
    if (typeof size === 'string') {
        if (size === 'natural') {
            return undefined;
        }
        return `var(--${size}Icon)`;
    }

    return `${size}px`;
};

const StyledIcon = styled.figure<IconProps>`
    color: ${props => props.color && props.color};
    width: ${props => _getSize(props.size)};
    height: ${props => _getSize(props.size)};
    margin: ${props => getCSSPadding(props.margin)};
    display: inline-block;
    flex-shrink: 0;
    max-height: 100%;
    max-width: 100%;

    svg {
        width: ${props => (props.size === 'natural' ? '' : '100%')};
        height: ${props => (props.size === 'natural' ? '' : '100%')};
        object-fit: cover;
    }
`;
