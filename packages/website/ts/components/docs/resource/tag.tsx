import React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface ITagText {
    isInverted?: boolean;
}

interface ITagProps extends ITagText {
    children: React.ReactNode;
}

export const Tag: React.FC<ITagProps> = ({ children, isInverted }) => {
    return (
        <TagText isInverted={isInverted}>
            {isInverted && (
                <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4.5L3.5 7L9 1" stroke="white" stroke-width="1.5" />
                </svg>
            )}
            {children}
        </TagText>
    );
};

const TagText = styled.div<ITagProps>`
    background-color: ${({ isInverted }) => (isInverted ? colors.brandDark : colors.backgroundLight)};
    color: ${({ isInverted }) => (isInverted ? colors.white : colors.brandDark)};
    border-radius: 4px;
    font-size: 0.666666667rem;
    font-family: 'Formular Mono';
    font-weight: 400;
    padding: 6px 10px 5px;
    display: inline-flex;
    align-items: center;
    text-transform: uppercase;

    & + & {
        margin-left: 10px;
    }

    svg {
        margin-right: 7px;
    }
`;

Tag.defaultProps = {
    isInverted: false,
};
