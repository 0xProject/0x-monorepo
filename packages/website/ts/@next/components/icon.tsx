import * as React from 'react';
import styled from 'styled-components';
import IconCoin from 'ts/@next/icons/illustrations/coin.svg';

interface Props {
    name: string;
    size?: string;
}

const ICONS = {
    coin: IconCoin,
};

export const Icon: React.FunctionComponent<Props> = (props: Props) => {
    const IconSVG = ICONS[props.name];

    return (
        <StyledIcon {...props}>
            <IconSVG />
        </StyledIcon>
    );
};

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
