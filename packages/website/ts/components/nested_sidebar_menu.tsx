import { Link } from 'ts/components/documentation/shared/link';

import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';
import { Button } from 'ts/components/ui/button';
import { Text } from 'ts/components/ui/text';
import { ALink, ScreenWidths } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { utils } from 'ts/utils/utils';

export interface NestedSidebarMenuProps {
    sectionNameToLinks: ObjectMap<ALink[]>;
    sidebarHeader?: React.ReactNode;
    shouldReformatMenuItemNames?: boolean;
    screenWidth: ScreenWidths;
}

export const NestedSidebarMenu = (props: NestedSidebarMenuProps) => {
    const navigation = _.map(props.sectionNameToLinks, (links: ALink[], sectionName: string) => {
        const finalSectionName = utils.convertCamelCaseToSpaces(sectionName);
        const menuItems = _.map(links, (link, i) => {
            const menuItemTitle = props.shouldReformatMenuItemNames
                ? _.capitalize(utils.convertDashesToSpaces(link.title))
                : link.title;
            const finalLink = {
                ...link,
                title: menuItemTitle,
            };
            return <MenuItem key={`menu-item-${menuItemTitle}`} link={finalLink} screenWidth={props.screenWidth} />;
        });
        // tslint:disable-next-line:no-unused-variable
        return (
            <div key={`section-${sectionName}`} className="py1" style={{ color: colors.greyTheme }}>
                <Text fontSize="14px" letterSpacing="0.5" className="py1 pl1">
                    {finalSectionName.toUpperCase()}
                </Text>
                {menuItems}
            </div>
        );
    });
    return (
        <div>
            {props.sidebarHeader}
            <div>{navigation}</div>
        </div>
    );
};

export interface MenuItemProps {
    link: ALink;
    screenWidth: ScreenWidths;
}

export interface MenuItemState {
    isActive: boolean;
}

export class MenuItem extends React.Component<MenuItemProps, MenuItemState> {
    constructor(props: MenuItemProps) {
        super(props);
        const isActive = window.location.hash.slice(1) === props.link.to;
        this.state = {
            isActive,
        };
    }
    public render(): React.ReactNode {
        const isActive = this.state.isActive;
        return (
            <Link
                to={this.props.link.to}
                shouldOpenInNewTab={this.props.link.shouldOpenInNewTab}
                onActivityChanged={this._onActivityChanged.bind(this)}
            >
                <Button
                    borderRadius="4px"
                    padding="0.4em 0.375em"
                    width="100%"
                    backgroundColor={
                        isActive
                            ? colors.lightLinkBlue
                            : this.props.screenWidth === ScreenWidths.Sm
                            ? 'white'
                            : colors.grey100
                    }
                    fontSize="14px"
                    textAlign="left"
                >
                    <Text
                        fontWeight={isActive ? 'bold' : 'normal'}
                        fontColor={isActive ? colors.white : colors.grey800}
                    >
                        {this.props.link.title}
                    </Text>
                </Button>
            </Link>
        );
    }
    private _onActivityChanged(isActive: boolean): void {
        this.setState({
            isActive,
        });
    }
}
