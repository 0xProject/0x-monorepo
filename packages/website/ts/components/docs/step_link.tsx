import { Link } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import styled, { withTheme } from 'styled-components';

import { Button } from 'ts/components/button';
import { SearchInput } from 'ts/components/docs/search_input';
import { Icon } from 'ts/components/icon';
import { Column, FlexWrap, WrapGrid } from 'ts/components/newLayout';
import { ThemeValuesInterface } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';

export interface StepLinkConfig {
    title: string;
    url: string;
    shouldOpenInNewTab?: boolean;
}

interface WrapperProps {}

export const StepLink: React.FunctionComponent<StepLinkConfig> = (props: StepLinkConfig) => (
    <>
        <Wrapper href={props.url}>
            <Text>{props.title}</Text>
            <svg width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2 0h11.5v11H12V2.62L1.06 13.56 0 12.5l11-11H2V0z"
                    fill="currentColor"
                />
            </svg>
        </Wrapper>
    </>
);

const Wrapper = styled.a<WrapperProps>`
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

const Text = styled.span`
    font-size: 1.25rem;
`;
