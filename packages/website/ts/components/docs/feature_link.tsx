import React from 'react';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

interface IFeatureLinkProps {
    heading: string;
    icon: string;
    description?: string;
    url: string;
}

export const FeatureLink: React.FC<IFeatureLinkProps> = props => (
    <FeatureLinkWrapper href={props.url}>
        <Icon color={colors.brandLight} name={props.icon} size={60} margin={[0, 30, 0, 0]} />
        <Content>
            <Heading asElement="h3" size="small" marginBottom="6px">
                {props.heading}
            </Heading>
            <Paragraph size="default" marginBottom="0">
                {props.description}
            </Paragraph>
        </Content>
        <svg viewBox="0 0 14 14" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 0h11.5v11H12V2.62L1.06 13.56 0 12.5l11-11H2V0z"
                fill="currentColor"
            />
        </svg>
    </FeatureLinkWrapper>
);

const FeatureLinkWrapper = styled.a`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
    padding: 30px;
    display: flex;
    align-items: center;
    margin-bottom: 0.555555556rem;
`;

const Content = styled.div`
    margin-right: auto;
    padding-right: 30px;
`;
