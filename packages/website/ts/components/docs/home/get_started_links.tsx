import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Heading, Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

interface IGetStartedLinksProps {
    heading?: string;
    links: IGetStartedLinkProps[];
}

export interface IGetStartedLinkProps {
    heading: string;
    description: string;
    url: string;
}

export const GetStartedLinks: React.FC<IGetStartedLinksProps> = ({ heading, links }) => (
    <div>
        {heading && <Heading size="default">{heading}</Heading>}
        {links.map((link, index) => (
            <GetStartedLink key={`getStartedLink-${index}`} {...link} />
        ))}
    </div>
);

export const GetStartedLink: React.FC<IGetStartedLinkProps> = props => (
    <>
        <GetStartedButton color={colors.brandDark} to={props.url} isWithArrow={true}>
            {props.heading}
        </GetStartedButton>
        <GetStartedParagraph color={colors.textDarkPrimary} isMuted={1}>
            {props.description}
        </GetStartedParagraph>
    </>
);

const GetStartedButton = styled(Button)`
    margin-bottom: 12px;

    @media (max-width: 500px) {
        font-size: 16px !important;

        svg {
            display: none;
        }
    }
`;

const GetStartedParagraph = styled(Paragraph)`
    &:last-of-type {
        margin-bottom: 0;
    }

    @media (max-width: 500px) {
        font-size: 14px;
    }
`;
