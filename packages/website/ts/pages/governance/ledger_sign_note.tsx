import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface LedgerSignNoteProps {
    text?: string;
    isVisible: boolean;
}

export const LedgerSignNote: React.StatelessComponent<LedgerSignNoteProps> = ({ text, isVisible }) => {
    return (
        <Wrapper isVisible={isVisible}>
            <Text>{text}</Text>
        </Wrapper>
    );
};

LedgerSignNote.defaultProps = {
    isVisible: false,
};

const Wrapper = styled.div<LedgerSignNoteProps>`
    background-color: #7a7a7a;
    display: flex;
    align-items: center;
    padding: 28px 30px;
    width: 100%;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    justify-content: center;
    opacity: ${props => (props.isVisible ? 1 : 0)};
    visibility: ${props => (props.isVisible ? 'visible' : 'hidden')};
`;

const Text = styled.p`
    color: ${colors.white};
    font-size: 1rem;
    line-height: 1;
    font-weight: 400;
`;
