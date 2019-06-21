import { Link } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import styled, { withTheme } from 'styled-components';

import { Button } from 'ts/components/button';
import { SearchInput } from 'ts/components/docs/search_input';
import { StepLink, StepLinkConfig } from 'ts/components/docs/step_link';
import { Icon } from 'ts/components/icon';
import { Column, FlexWrap, WrapGrid } from 'ts/components/newLayout';
import { ThemeValuesInterface } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';

export interface LinkProps {
    links: StepLinkConfig[];
}

export const StepLinks: React.FunctionComponent<LinkProps> = (props: LinkProps) => (
    <>
        <Wrapper>
            {props.links.map((shortcut, index) => <StepLink key={`step-${index}`} {...shortcut} />)}
        </Wrapper>
    </>
);

StepLinks.defaultProps = {
    links: [],
};

const Wrapper = styled.div`
    background-color: ${colors.backgroundLight};
    border: 1px solid #DBDFDD;
`;
