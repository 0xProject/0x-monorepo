import * as React from 'react';
import styled from 'styled-components';

import { Link } from '@0x/react-shared';

import { colors } from 'ts/style/colors';

export interface IStepLinkProps {
    title: string;
    url: string;
}

interface IStepLinksProps {
    links: IStepLinkProps[];
}

export const StepLinks: React.FC<IStepLinksProps> = ({ links }) => (
    <StepLinksWrapper>
        {links.map((link, index) => (
            <StepLink key={`step-${index}`} {...link} />
        ))}
    </StepLinksWrapper>
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
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
`;

const StepLinkWrapper = styled(Link)`
    padding: 21px 25px 19px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &:hover {
        background: ${colors.brandDark};

        * {
            color: ${colors.white};
            fill: ${colors.white};
        }
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
