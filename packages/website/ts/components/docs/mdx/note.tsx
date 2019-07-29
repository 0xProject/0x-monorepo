import * as React from 'react';
import styled from 'styled-components';

import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

export interface INoteProps {
    heading: string;
    description?: string;
}

export const Note: React.FC<INoteProps> = props => (
    <NoteWrapper>
        <Heading asElement="h4" color={colors.brandDark} size={17} marginBottom="6px">
            {props.heading}
        </Heading>
        <Description>{props.description}</Description>
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

const Description = styled(Paragraph)`
    font-size: 0.88rem;
    margin-bottom: 0;
    line-height: 1.4;
    opacity: 1;
`;
