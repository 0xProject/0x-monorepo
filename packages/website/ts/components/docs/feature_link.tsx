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

export interface LinkProps {
    heading: string;
    icon: string;
    description?: string;
    url: string;
    shouldOpenInNewTab?: boolean;
}

interface WrapperProps {}

export const FeatureLink: React.FunctionComponent<LinkProps> = (props: LinkProps) => (
    <>
        <Wrapper href={props.url}>
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
        </Wrapper>
    </>
);

const Wrapper = styled.a`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
    padding: 30px 30px;
    display: flex;
    align-items: center;
    margin-bottom: 0.555555556rem;
`;

const Content = styled.div`
    margin-right: auto;
    padding-right: 30px;
`;
