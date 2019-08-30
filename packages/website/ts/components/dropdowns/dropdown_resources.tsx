import * as _ from 'lodash';
import * as React from 'react';
import styled, { withTheme } from 'styled-components';
import { Column, FlexWrap } from 'ts/components/newLayout';
import { Heading } from 'ts/components/text';
import { IThemeValuesInterface } from 'ts/style/theme';
import { WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';

import { Link } from '../documentation/shared/link';

interface Props {
    theme: IThemeValuesInterface;
}

interface LinkConfig {
    label: string;
    url: string;
    shouldOpenInNewTab?: boolean;
}

const introData: LinkConfig[] = [
    {
        label: 'Blog',
        url: constants.URL_BLOG,
        shouldOpenInNewTab: true,
    },
    {
        label: 'Legal Guide',
        url: `${WebsitePaths.DocsGuides}/legal-guide`,
        shouldOpenInNewTab: true,
    },
];

const programsData: LinkConfig[] = [
    {
        label: 'Ecosystem Grants',
        url: WebsitePaths.Ecosystem,
    },
    {
        label: 'Market Making',
        url: WebsitePaths.MarketMaker,
    },
    {
        label: 'Infrastructure Credits',
        url: WebsitePaths.Credits,
    },
];

export const DropdownResources: React.FunctionComponent<Props> = withTheme((props: Props) => (
    <>
        <DropdownWrap>
            <ul>
                {_.map(introData, (item, index) => (
                    <li key={`introLink-${index}`}>
                        <Link to={item.url} shouldOpenInNewTab={item.shouldOpenInNewTab}>
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>

            <StyledWrap>
                <Column width="calc(100% - 15px)">
                    <Heading asElement="h4" size={14} color="inherit" marginBottom="15px" isMuted={0.35}>
                        Programs
                    </Heading>

                    <ul>
                        {_.map(programsData, (item, index) => (
                            <li key={`programsLink-${index}`}>
                                <Link to={item.url} shouldOpenInNewTab={item.shouldOpenInNewTab}>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Column>
            </StyledWrap>
        </DropdownWrap>
    </>
));

const DropdownWrap = styled.div`
    padding: 15px 30px 0 30px;

    a {
        color: inherit;
    }

    ul li {
        margin: 0 0 16px 0;
    }
`;

const StyledWrap = styled(FlexWrap)`
    padding-top: 20px;
    margin-top: 10px;
    position: relative;
`;
