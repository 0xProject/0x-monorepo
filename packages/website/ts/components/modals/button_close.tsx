import * as React from 'react';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';

interface Props {
    onClick: (e: React.MouseEvent<HTMLElement>) => void;
}

export const ButtonClose = (props: Props) => {
    const { onClick } = props;
    return (
        <StyledButtonClose onClick={onClick}>
            <span>Close</span>
            <Icon name="close-modal" size={27} margin={[0, 0, 0, 0]} />
        </StyledButtonClose>
    );
};

const StyledButtonClose = styled.button.attrs({
    type: 'button',
})`
    cursor: pointer;
    position: absolute;
    right: 0;
    top: 0;
    overflow: hidden;
    width: 27px;
    height: 27px;
    border: 0;
    background-color: transparent;
    padding: 0;
    transform: translateY(-47px);

    span {
        opacity: 0;
        visibility: hidden;
        position: absolute;
    }
`;
