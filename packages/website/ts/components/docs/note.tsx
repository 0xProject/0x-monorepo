import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

export interface NoteProps {
    heading: string;
    description?: string;
}

interface WrapperProps {}

export const Note: React.FunctionComponent<NoteProps> = (props: NoteProps) => (
    <>
        <Wrapper>
            <Content>
                <NoteHeading marginBottom="6px">{props.heading}</NoteHeading>
                <Description>{props.description}</Description>
            </Content>
        </Wrapper>
    </>
);

const Wrapper = styled.div`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
    padding: 20px 14px;
    display: flex;
    align-items: center;
    float: right;
    max-width: 300px;
    margin-left: 30px;
    margin-bottom: 30px;
`;

const Content = styled.div``;

const NoteHeading = styled(Heading).attrs({ color: colors.brandDark, asElement: 'h4' })`
    font-size: 0.944444444rem !important;
    margin-bottom: 6px;
`;

const Description = styled(Paragraph)`
    font-size: 0.888888889rem;
    margin-bottom: 0;
    line-height: 1.25;
    opacity: 1;
`;
