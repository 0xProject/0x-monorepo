import * as _ from 'lodash';
import * as React from 'react';
import {
    Tab as OriginalTab,
    TabList as OriginalTabList,
    TabPanel as OriginalTabPanel,
    Tabs as OriginalTabs,
} from 'react-tabs';
import styled, { withTheme } from 'styled-components';
import { colors } from 'ts/style/colors';

export const Tabs = styled(OriginalTabs).attrs({
    selectedTabClassName: 'is-active',
})`
    margin-bottom: 1.875rem;

    .is-active {
        background-color: #f3f6f4;
        color: ${colors.brandDark};
    }
`;

export const Tab = styled(OriginalTab)`
    background-color: transparent;
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    padding: 12px 12px 13px;
    font-size: 1rem;
    color: #5c5c5c;
    font-weight: 300;
`;

export const TabPanel = styled(OriginalTabPanel).attrs({
    selectedClassName: 'is-active',
})`
    background-color: #f3f6f4;
    border-radius: 4px;
    padding: 12px 12px;
    display: none;

    &.is-active {
        display: block;
    }
`;

export const TabList = styled(OriginalTabList)`
    display: flex;
`;
