import { Link } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import styled, { withTheme } from 'styled-components';

import { Button } from 'ts/components/button';
import { SearchInput } from 'ts/components/docs/search_input';
import { Column, FlexWrap, WrapGrid } from 'ts/components/newLayout';
import { ThemeValuesInterface } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';

interface Props {
    isHome?: boolean;
    title?: string;
    description?: string;
}

interface LinkConfig {
    label: string;
    url: string;
    shouldOpenInNewTab?: boolean;
}

export const Hero: React.FunctionComponent<Props> = (props: Props) => (
    <>
        <Wrapper isHome={props.isHome}>
            <Heading size="large" isCentered={true} marginBottom={props.isHome || props.description ? '30px' : '0'}>{props.title}</Heading>
            {props.description && <Paragraph isCentered={true}>{props.description}</Paragraph>}
            {props.isHome && <SearchInput isHome={true} />}
        </Wrapper>
    </>
);

Hero.defaultProps = {
    isHome: false,
};

const Wrapper = styled.div<Props>`
    background-color: ${colors.backgroundLight};
    padding-top: ${props => props.isHome && `63px`};
    padding-bottom: 80px;
    margin-bottom: 60px;
    min-height: 15rem;
    min-height: ${props => props.isHome ? '21.875rem' : '13.222rem'};
    display: flex;
    flex-direction: column;
    justify-content: center;
`;
