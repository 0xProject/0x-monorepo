import * as React from 'react';
import styled from 'styled-components';
import { colors } from '../variables';

import { Tabs as ReactTabs, Tab, TabList, TabPanel } from 'react-tabs'

import {withContext, Props} from './withContext';

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
    margin-left: .25rem;
  }
  &:focus, &:hover {
    color: red;
    outline: 0;
  }
`;

const Root = styled.div<{primaryColor: string;}>`
  ${StyledTab} {
    background-color: ${props => props.primaryColor};
  }
  ${StyledTab}[aria-selected="true"] {
    background-color: ${colors.gray};
  } 
`;

interface TabsProps extends Props {
  children: React.ReactNode;
}

function Tabs(props: TabsProps) {
  return (
    <Root primaryColor={props.colors.secondary}>
      <ReactTabs>
        <StyledTabList>
          { React.Children.map(props.children, child => {
            const {props} = React.cloneElement(child as React.ReactElement<any>);
            return <StyledTab>{props.title}</StyledTab>
          }) }
        </StyledTabList>

        { React.Children.map(props.children, child => (
          <TabPanel>{child}</TabPanel>
        )) }
      </ReactTabs>
    </Root>
  )
}

interface TabBlockProps {
  title: string;
  children: React.ReactNode;
}

function TabBlock(props: TabBlockProps) {
  return (
    <React.Fragment>
      {props.children}
    </React.Fragment>
  )
}

const ContextTabs = withContext(Tabs);

export {ContextTabs as Tabs, TabBlock};