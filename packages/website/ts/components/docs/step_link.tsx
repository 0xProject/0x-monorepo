import React from 'react';
import styled from 'styled-components';

import { Link } from '@0x/react-shared';

import { colors } from 'ts/style/colors';

export interface IStepLinkConfig {
    title: string;
    url: string;
}

export const StepLink: React.FC<IStepLinkConfig> = props => (
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
