import React from 'react';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

export interface ICommunityLinkProps {
    heading: string;
    icon: string;
    description?: string;
    url: string;
}

export const CommunityLink: React.FC<ICommunityLinkProps> = props => (
    <CommunityLinkWrapper href={props.url}>
        <CommunityIcon color={colors.brandLight} name={props.icon} margin={[0, 0, 24, 0]} />
        <Heading size="small" marginBottom="8px">
            {props.heading}
        </Heading>
        <Paragraph size="default" marginBottom="0">
            {props.description}
        </Paragraph>
    </CommunityLinkWrapper>
);

const CommunityLinkWrapper = styled.a`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
    padding: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
`;

const CommunityIcon = styled(Icon)`
    @media (min-width: 900px) {
        height: 98px;
        width: 98px;
    }
`;
