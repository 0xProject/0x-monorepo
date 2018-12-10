import * as React from 'react';
import Loadable from 'react-loadable';
import styled from 'styled-components';
import {getCSSPadding} from 'ts/@next/constants/utilities';

interface IconProps {
    name: string;
    margin?: Array<'small' | 'default' | 'large' | number> | number;
    size?: 'small' | 'medium' | 'large' | number;
}

export const Icon: React.FunctionComponent<Props> = (props: Props) => {
    const IconSVG = Loadable({
        loader: () => import(`ts/@next/icons/illustrations/${props.name}.svg`),
        loading: () => 'Loading',
    });

    return (
        <StyledIcon {...props}>
            <IconSVG />
        </StyledIcon>
    );
};

export const InlineIconWrap = styled.div`
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

const StyledIcon = styled.figure`
    width: ${props => _getSize(props.size)};
    height: ${props => _getSize(props.size)};
    margin: 0;
    flex-shrink: 0;

    svg {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;
