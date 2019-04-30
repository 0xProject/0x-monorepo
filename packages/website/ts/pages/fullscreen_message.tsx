import * as React from 'react';
import styled from 'styled-components';
import { colors } from 'ts/style/colors';

export interface FullscreenMessageProps {
    headerText: string;
    bodyText: string;
}

export const FullscreenMessage = (props: FullscreenMessageProps) => {
    return (
        <div className="mx-auto max-width-4 py4">
            <div className="center py4">
                <Heading>{props.headerText}</Heading>
                <Paragraph>{props.bodyText}</Paragraph>
            </div>
        </div>
    );
};

const Heading = styled.h1`
    color: ${colors.brandLight};
    font-size: 78px;
    font-weight: 300;
    margin-bottom: 35px;
`;

const Paragraph = styled.p`
    color: #7a7a7a;
    font-size: 22px;
    line-height: 1.409090909;
`;
