import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs as ReactTabs } from 'react-tabs';
import styled from 'styled-components';

import { colors } from 'ts/variables';

import { Breakout } from './Breakout';

const StyledTabList = styled(TabList)`
    text-transform: uppercase;
    list-style: none;
    margin: 0;
    padding: 0;
    overflow: hidden;
`;

const StyledTab = styled(Tab)`
    height: 2.5rem;
    padding-left: 1rem;
    padding-right: 1rem;
    display: flex;
    justify-content: space-around;
    align-items: center;
    float: left;
    &:not(:first-of-type) {
        margin-left: 0.25rem;
    }
`;

const Root =
    styled.div <
    { colors: any } >
    `
    ${StyledTab} {
        background-color: ${props => props.theme.colors.secondary};
        &[aria-selected="true"] {
            background-color: ${colors.gray};

        }

        &[aria-selected="false"]:focus,
        &[aria-selected="false"]:hover {
            background-color: ${props => props.theme.colors.secondary_alt};
            cursor: pointer;
        }
    }
`;

const Tabs: React.StatelessComponent<{}> = props => (
    <Breakout>
        <Root>
            <ReactTabs>
                <StyledTabList>
                    {React.Children.map(props.children, child => {
                        const { title } = React.cloneElement(child as React.ReactElement<any>).props;
                        return <StyledTab>{title}</StyledTab>;
                    })}
                </StyledTabList>

                {React.Children.map(props.children, child => <TabPanel>{child}</TabPanel>)}
            </ReactTabs>
        </Root>
    </Breakout>
);

interface TabBlockProps {
    title: string;
}

const TabBlock: React.StatelessComponent<TabBlockProps> = props => <React.Fragment>{props.children}</React.Fragment>;

const ContextTabs = Tabs;

export { ContextTabs as Tabs, TabBlock };
