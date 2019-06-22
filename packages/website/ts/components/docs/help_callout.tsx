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

export interface HelpCalloutProps {
    heading?: string;
    description?: string;
    url?: string;
}

interface WrapperProps {
    isHome?: boolean;
}

export const HelpCallout: React.FunctionComponent<HelpCalloutProps> = (props: HelpCalloutProps) => (
    <>
        <Wrapper href={props.url}>
            <Icon color={colors.brandLight} name="help" size={38} margin={[0, 30, 0, 0]} />
            <div>
                <Heading size="small" marginBottom="8px">{props.heading}</Heading>
                <Paragraph size="default" marginBottom="0">{props.description}</Paragraph>
            </div>
        </Wrapper>
    </>
);

HelpCallout.defaultProps = {
    heading: 'Need some help?',
    description: 'Get in touch here and we’ll be happy to help.',
};

const Wrapper = styled.a<WrapperProps>`
    background-color: ${colors.backgroundLight};
    padding: 25px 30px;
    display: flex;
    align-items: center;
    margin-bottom: 1.875rem;
`;
