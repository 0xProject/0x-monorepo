import * as React from 'react';
import { Alignment, Classes, Navbar, NavbarGroup, NavbarHeading, NavbarDivider } from '@blueprintjs/core';

export class Nav extends React.PureComponent<{}> {
    public render() {
        return (
            <Navbar className={Classes.DARK} style={{backgroundColor:"#383838";}}>
                <NavbarGroup align={Alignment.LEFT}>
                    <NavbarHeading>Quote Requestor</NavbarHeading>
                </NavbarGroup>
            </Navbar>
        );
    }
}
