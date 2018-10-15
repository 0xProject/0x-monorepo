import { ObjectMap } from '@0xproject/types';
import * as _ from 'lodash';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';

import { ALink, Styles } from '../types';
import { colors } from '../utils/colors';
import { utils } from '../utils/utils';

import { Link } from './link';

export interface NestedSidebarMenuProps {
    sectionNameToLinks: ObjectMap<ALink[]>;
    sidebarHeader?: React.ReactNode;
    shouldDisplaySectionHeaders?: boolean;
    shouldReformatMenuItemNames?: boolean;
}

export interface NestedSidebarMenuState {}

const styles: Styles = {
    menuItemWithHeaders: {
        minHeight: 0,
    },
    menuItemWithoutHeaders: {
        minHeight: 48,
    },
    menuItemInnerDivWithHeaders: {
        color: colors.grey800,
        fontSize: 14,
        lineHeight: 2,
        padding: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
};

export class NestedSidebarMenu extends React.Component<NestedSidebarMenuProps, NestedSidebarMenuState> {
    public static defaultProps: Partial<NestedSidebarMenuProps> = {
        shouldDisplaySectionHeaders: true,
        shouldReformatMenuItemNames: true,
    };
    public render(): React.ReactNode {
        const navigation = _.map(this.props.sectionNameToLinks, (links: ALink[], sectionName: string) => {
            const finalSectionName = utils.convertCamelCaseToSpaces(sectionName);
            if (this.props.shouldDisplaySectionHeaders) {
                // tslint:disable-next-line:no-unused-variable
                return (
                    <div key={`section-${sectionName}`} className="py1" style={{ color: colors.greyTheme }}>
                        <div style={{ fontSize: 14, letterSpacing: 0.5 }} className="py1">
                            {finalSectionName.toUpperCase()}
                        </div>
                        {this._renderMenuItems(links)}
                    </div>
                );
            } else {
                return <div key={`section-${sectionName}`}>{this._renderMenuItems(links)}</div>;
            }
        });
        return (
            <div>
                {this.props.sidebarHeader}
                <div className="pl1">{navigation}</div>
            </div>
        );
    }
    private _renderMenuItems(links: ALink[]): React.ReactNode[] {
        const menuItemStyles = this.props.shouldDisplaySectionHeaders
            ? styles.menuItemWithHeaders
            : styles.menuItemWithoutHeaders;
        const menuItemInnerDivStyles = this.props.shouldDisplaySectionHeaders ? styles.menuItemInnerDivWithHeaders : {};
        const menuItems = _.map(links, link => {
            const finalMenuItemName = this.props.shouldReformatMenuItemNames
                ? utils.convertDashesToSpaces(link.title)
                : link.title;
            return (
                <div key={`menuItem-${finalMenuItemName}`}>
                    <Link to={link.to} shouldOpenInNewTab={link.shouldOpenInNewTab}>
                        <MenuItem style={menuItemStyles} innerDivStyle={menuItemInnerDivStyles}>
                            <span
                                style={{
                                    textTransform: this.props.shouldReformatMenuItemNames ? 'capitalize' : 'none',
                                }}
                            >
                                {finalMenuItemName}
                            </span>
                        </MenuItem>
                    </Link>
                </div>
            );
        });
        return menuItems;
    }
}
