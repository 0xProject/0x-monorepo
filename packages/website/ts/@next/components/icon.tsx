import * as React from 'react';
import Loadable from 'react-loadable';
import styled from 'styled-components';
import {getCSSPadding, PaddingInterface} from 'ts/@next/constants/utilities';

interface IconProps extends PaddingInterface {
    name: string;
    component?: React.ReactNode;
    size?: 'small' | 'medium' | 'large' | 'hero' | number;
}

export const Icon: React.FunctionComponent<IconProps> = (props: IconProps) => {
    if (props.name && !props.component) {
        const IconSVG = Loadable({
            loader: async () => import(/* webpackChunkName: "icon" */`ts/@next/icons/illustrations/${props.name}.svg`),
            loading: () => 'Loading',
        });

        return (
            <StyledIcon {...props}>
                <IconSVG />
            </StyledIcon>
        );
    }

    if (props.component) {
        return (
            <StyledIcon {...props}>
                {props.component}
            </StyledIcon>
        );
    }

    return null;
};

export const InlineIconWrap = styled.div<IconProps>`
    margin: ${props => getCSSPadding(props.margin)};
    display: flex;
    align-items: center;
    justify-content: center;

    > figure {
        margin: 0 5px;
    }
`;

const _getSize = (size: string | number = 'small'): string => {
    if (isNaN(size)) {
        return `var(--${size}Icon)`;
    }

    return `${size}px`;
};

const StyledIcon = styled.figure<IconProps>`
    width: ${props => _getSize(props.size)};
    height: ${props => _getSize(props.size)};
    margin: ${props => getCSSPadding(props.margin)};
    display: inline-block;
    flex-shrink: 0;

    svg {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;
