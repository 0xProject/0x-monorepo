import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface ITagProps {
    isInverted?: boolean;
}

export const Tag = styled.div<ITagProps>`
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
`;

Tag.defaultProps = {
    isInverted: false,
};
