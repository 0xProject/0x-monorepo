import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

export interface INoteProps {
    children?: React.ReactNode;
    description?: string;
    heading?: string;
}

export const Note: React.FC<INoteProps> = ({ children, description, heading }) => (
    <NoteWrapper>
        {heading && <NoteHeading>{heading}</NoteHeading>}
        <Description>{description || children}</Description>
    </NoteWrapper>
);

const NoteHeading = styled.strong`
    display: block;
    font-size: 17px,
    margin-bottom: 10px;
    color: ${colors.brandDark};
`;

const NoteWrapper = styled.span`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
    padding: 20px 14px;
    float: right;
    max-width: 300px;
    margin-left: 30px;
    margin-bottom: 30px;
`;

const Description = styled.span`
    font-size: 0.88rem;
    margin-bottom: 0;
    line-height: 1.4;
    opacity: 1;
`;
