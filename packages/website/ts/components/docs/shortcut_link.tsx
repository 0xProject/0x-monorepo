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
    isHome?: boolean;
}

interface WrapperProps {
    isHome?: boolean;
}

export const ShortcutLink: React.FunctionComponent<LinkProps> = (props: LinkProps) => (
    <>
        <Wrapper isHome={props.isHome} href={props.url}>
            <Icon color={colors.brandLight} name={props.icon} size={80} margin={[0, 40, 0, 0]} />
            <div>
                <Heading size="small" marginBottom="8px">
                    {props.heading}
                </Heading>
                <Paragraph size="default" marginBottom="0">
                    {props.description}
                </Paragraph>
            </div>
        </Wrapper>
    </>
);

ShortcutLink.defaultProps = {
    isHome: false,
};

const Wrapper = styled.a<WrapperProps>`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
    padding: 50px 50px;
    display: flex;
    align-items: center;
`;
