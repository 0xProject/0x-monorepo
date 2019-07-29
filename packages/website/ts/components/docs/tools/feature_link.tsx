import * as React from 'react';
import styled from 'styled-components';

import MediaQuery from 'react-responsive';

import { Link } from '@0x/react-shared';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

interface IFeatureLinkProps {
    title: string;
    description?: string;
    url: string;
}

export const FeatureLink: React.FC<IFeatureLinkProps> = props => (
    <FeatureLinkWrapper to={props.url}>
        <StyledIcon color={colors.brandLight} name="flexibleIntegration" size={60} />
        <Content>
            <div>
                <Heading asElement="h3" size="small" marginBottom="6px">
                    {props.title}
                </Heading>
                <Paragraph size="default" marginBottom="0">
                    {props.description}
                </Paragraph>
            </div>

            <MediaQuery minWidth={500}>
                <svg viewBox="0 0 14 14" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2 0h11.5v11H12V2.62L1.06 13.56 0 12.5l11-11H2V0z"
                        fill="currentColor"
                    />
                </svg>
            </MediaQuery>
        </Content>
    </FeatureLinkWrapper>
);

const StyledIcon = styled(Icon)`
    margin-bottom: 12px;

    @media (min-width: 500px) {
        margin-bottom: 0;
        margin-right: 30px;
    }
`;

const FeatureLinkWrapper = styled(Link)`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
    padding: 30px;
    margin-bottom: 0.56rem;

    display: flex;
    align-items: center;
    flex-direction: column;

    @media (min-width: 500px) {
        flex-direction: row;
    }
`;

const Content = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;

    text-align: center;

    @media (min-width: 500px) {
        text-align: left;
    }

    svg {
        margin-left: 30px;
        min-width: 14px;
    }
`;
