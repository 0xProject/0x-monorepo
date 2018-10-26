import * as React from 'react';
import styled from 'styled-components';
import { colors } from 'ts/variables';
import { Tabs as ReactTabs, Tab, TabList, TabPanel } from 'react-tabs';
import Breakout from './Breakout';
import { withContext, Props } from './withContext';

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
        background-color: ${props => props.colors.secondary};
        &[aria-selected="true"] {
            background-color: ${colors.gray};

        }

        &[aria-selected="false"]:focus,
        &[aria-selected="false"]:hover {
            background-color: ${props => props.colors.secondary_alt};
            cursor: pointer;
        }
    }
`;

interface TabsProps extends Props {
    children: React.ReactNode;
}

function Tabs(props: TabsProps) {
    return (
        <Breakout>
            <Root colors={props.colors}>
                <ReactTabs>
                    <StyledTabList>
                        {React.Children.map(props.children, child => {
                            const { props } = React.cloneElement(child as React.ReactElement<any>);
                            return <StyledTab>{props.title}</StyledTab>;
                        })}
                    </StyledTabList>

                    {React.Children.map(props.children, child => <TabPanel>{child}</TabPanel>)}
                </ReactTabs>
            </Root>
        </Breakout>
    );
}

interface TabBlockProps {
    title: string;
    children: React.ReactNode;
}

function TabBlock(props: TabBlockProps) {
    return <React.Fragment>{props.children}</React.Fragment>;
}

const ContextTabs = withContext(Tabs);

export { ContextTabs as Tabs, TabBlock };
