import * as React from 'react';
import styled from 'styled-components';

import { Link } from 'ts/components/documentation/shared/link';
import { Heading } from 'ts/components/text';

import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';

interface IStepLinksProps {
    heading?: string;
    links: IStepLinkProps[];
}

export interface IStepLinkProps {
    title: string;
    url: string;
}

export const StepLinks: React.FC<IStepLinksProps> = ({ heading, links }) => (
    <div>
        {heading && <Heading size="default">{heading}</Heading>}
        <StepLinksWrapper>
            {links.map((link, index) => (
                <StepLink key={`step-${index}`} {...link} />
            ))}
        </StepLinksWrapper>
    </div>
);

export const StepLink: React.FC<IStepLinkProps> = props => (
    <StepLinkWrapper to={props.url}>
        <StepLinkText>{props.title}</StepLinkText>
        <svg height="14px" width="14px" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 0h11.5v11H12V2.62L1.06 13.56 0 12.5l11-11H2V0z"
                fill="currentColor"
            />
        </svg>
    </StepLinkWrapper>
);

const StepLinksWrapper = styled.div`
    border: 1px solid #dbdfdd;
    margin-bottom: ${docs.marginBottom};
`;

const StepLinkWrapper = styled(Link)`
    padding: 21px 25px 19px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    background: ${colors.backgroundLight};
    transition: background 250ms ease-in-out;

    &:hover {
        background: ${colors.backgroundLightHover};
    }

    & + & {
        border-top: 1px solid #dbdfdd;
    }

    @media (max-width: 500px) {
        svg {
            transform: scale(0.85);
        }
    }
`;

const StepLinkText = styled.span`
    font-size: 1.25rem;

    @media (max-width: 500px) {
        font-size: 16px;
    }
`;
