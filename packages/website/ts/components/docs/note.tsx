import React from 'react';
import styled from 'styled-components';

import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

export interface INoteProps {
    heading: string;
    description?: string;
}

export const Note: React.FC<INoteProps> = props => (
    <NoteWrapper>
        <NoteHeading marginBottom="6px">{props.heading}</NoteHeading>
        <NoteDescription>{props.description}</NoteDescription>
    </NoteWrapper>
);

const NoteWrapper = styled.div`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
    padding: 20px 14px;
    float: right;
    max-width: 300px;
    margin-left: 30px;
    margin-bottom: 30px;
`;

const NoteHeading = styled(Heading).attrs({ color: colors.brandDark, asElement: 'h4' })`
    font-size: 0.944444444rem !important;
    margin-bottom: 6px;
`;

const NoteDescription = styled(Paragraph)`
    font-size: 0.888888889rem;
    margin-bottom: 0;
    line-height: 1.4;
    opacity: 1;
`;
