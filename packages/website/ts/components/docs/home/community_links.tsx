import * as React from 'react';
import styled from 'styled-components';

import { Link } from 'ts/components/documentation/shared/link';


import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

export interface ICommunityLinkProps {
    heading: string;
    icon: string;
    description?: string;
    url: string;
}

interface ICommunityLinksProps {
    links: ICommunityLinkProps[];
}

export const CommunityLinks: React.FC<ICommunityLinksProps> = ({ links }) => {
    return (
        <CommunityLinksWrapper>
            {links.map((link, index) => (
                <CommunityLink key={`communityLink-${index}`} {...link} />
            ))}
        </CommunityLinksWrapper>
    );
};

export const CommunityLink: React.FC<ICommunityLinkProps> = props => (
    <CommunityLinkWrapper to={props.url} shouldOpenInNewTab={true}>
        <CommunityIcon color={colors.brandLight} name={props.icon} margin={[0, 0, 24, 0]} />
        <Heading size="small" marginBottom="8px">
            {props.heading}
        </Heading>
        <Paragraph size="default" marginBottom="0">
            {props.description}
        </Paragraph>
    </CommunityLinkWrapper>
);

const CommunityLinksWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-column-gap: 30px;
    grid-row-gap: 30px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const CommunityLinkWrapper = styled(Link)`
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
