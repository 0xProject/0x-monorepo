import { ALink, colors, Link, utils as sharedUtils } from '@0x/react-shared';
import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';
import { Button } from 'ts/components/ui/button';
import { Text } from 'ts/components/ui/text';

export interface NestedSidebarMenuProps {
    sectionNameToLinks: ObjectMap<ALink[]>;
    sidebarHeader?: React.ReactNode;
    shouldReformatMenuItemNames?: boolean;
}

export const NestedSidebarMenu = (props: NestedSidebarMenuProps) => {
    const navigation = _.map(props.sectionNameToLinks, (links: ALink[], sectionName: string) => {
        const finalSectionName = sharedUtils.convertCamelCaseToSpaces(sectionName);
        const menuItems = _.map(links, (link, i) => {
            const menuItemTitle = props.shouldReformatMenuItemNames
                ? _.capitalize(sharedUtils.convertDashesToSpaces(link.title))
                : link.title;
            const finalLink = {
                ...link,
                title: menuItemTitle,
            };
            return <MenuItem key={`menu-item-${menuItemTitle}`} link={finalLink} />;
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
                    backgroundColor={isActive ? colors.lightLinkBlue : colors.grey100}
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
