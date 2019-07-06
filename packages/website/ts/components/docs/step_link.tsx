import React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

export interface IStepLinkConfig {
    title: string;
    url: string;
    shouldOpenInNewTab?: boolean;
}

export const StepLink: React.FC<IStepLinkConfig> = props => (
    <StepLinkWrapper href={props.url}>
        <StepLinkText>{props.title}</StepLinkText>
        <svg width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 0h11.5v11H12V2.62L1.06 13.56 0 12.5l11-11H2V0z"
                fill="currentColor"
            />
        </svg>
    </StepLinkWrapper>
);

const StepLinkWrapper = styled.a`
    color: ${colors.brandDark};
    padding: 21px 25px 19px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &:hover {
        background-color: ${colors.brandDark};
        color: ${colors.white};
    }

    & + & {
        border-top: 1px solid #dbdfdd;
    }
`;

const StepLinkText = styled.span`
    font-size: 1.25rem;
`;
