import { Link } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import { colors } from 'ts/style/colors';

export interface TagProps {
    children: React.ReactNode;
    isInverted?: boolean;
}

interface WrapperProps {
    isInverted?: boolean;
}

export const Tag: React.FunctionComponent<TagProps> = ({ isInverted, children }: TagProps) => (
    <Wrapper isInverted={isInverted}>{children}</Wrapper>
);

Tag.defaultProps = {
    isInverted: false,
};

const Wrapper = styled.div<WrapperProps>`
    background-color: ${props => (props.isInverted ? colors.brandDark : 'rgba(0, 56, 49, 0.1)')};
    border-radius: 4px;
    color: ${props => (props.isInverted ? colors.white : colors.brandDark)};
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
