import React from 'react';
import styled from 'styled-components';

import { zIndex } from 'ts/style/z_index';

interface Props {
    isOpen: boolean;
    onClick?: () => void;
}

export const Hamburger: React.FC<Props> = (props: Props) => {
    return (
        <StyledHamburger isOpen={props.isOpen} onClick={props.onClick}>
            <span />
            <span />
            <span />
        </StyledHamburger>
    );
};

const StyledHamburger = styled.button<Props>`
    background: none;
    border: 0;
    width: 22px;
    height: 16px;
    position: relative;
    z-index: ${zIndex.header};
    padding: 0;
    outline: none;
    user-select: none;

    span {
        display: block;
        background-color: ${props => props.theme.textColor};
        width: 100%;
        height: 2px;
        margin-bottom: 5px;
        transform-origin: 4px 0px;
        transition: transform 0.5s cubic-bezier(0.77, 0.2, 0.05, 1),
            background-color 0.5s cubic-bezier(0.77, 0.2, 0.05, 1), opacity 0.55s ease;

        &:first-child {
            //transform-origin: 0% 0%;
        }

        &:last-child {
            //transform-origin: 0% 100%;
        }

        ${props =>
            props.isOpen &&
            `
            opacity: 1;
            transform: rotate(45deg) translate(0, 1px);

            &:nth-child(2) {
                opacity: 0;
                transform: rotate(0deg) scale(0.2, 0.2);
            }

            &:last-child {
                transform: rotate(-45deg) translate(1px, -4px);
            }
        `}
    }
`;
