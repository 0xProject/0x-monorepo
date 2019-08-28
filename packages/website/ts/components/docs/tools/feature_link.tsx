import * as React from 'react';
import styled from 'styled-components';

import MediaQuery from 'react-responsive';

import { Link } from 'ts/components/documentation/shared/link';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

interface IFeatureLinkProps {
    description?: string;
    externalUrl?: string;
    title: string;
    url?: string;
}

export const FeatureLink: React.FC<IFeatureLinkProps> = ({ description, externalUrl, title, url }) => {
    const to = externalUrl ? externalUrl : url;

    return (
        <FeatureLinkWrapper shouldOpenInNewTab={externalUrl ? true : false} to={to}>
            <Content>
                <div>
                    <Heading asElement="h3" size="small" marginBottom="6px">
                        {title}
                    </Heading>
                    <Paragraph size="default" marginBottom="0">
                        {description}
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
};

const FeatureLinkWrapper = styled(Link)`
    border: 1px solid #dbdfdd;
    padding: 30px;
    margin-bottom: 0.56rem;

    display: flex;
    align-items: center;
    flex-direction: column;

    background: ${colors.backgroundLight};
    transition: background 250ms ease-in-out;

    &:hover {
        background: ${colors.backgroundLightHover};
    }

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
