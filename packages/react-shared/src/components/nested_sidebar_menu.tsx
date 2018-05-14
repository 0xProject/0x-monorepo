import * as _ from 'lodash';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';
import { Link as ScrollLink } from 'react-scroll';

import { MenuSubsectionsBySection, Styles } from '../types';
import { colors } from '../utils/colors';
import { constants } from '../utils/constants';
import { utils } from '../utils/utils';

import { VersionDropDown } from './version_drop_down';

export interface NestedSidebarMenuProps {
    topLevelMenu: { [topLevel: string]: string[] };
    menuSubsectionsBySection: MenuSubsectionsBySection;
    sidebarHeader?: React.ReactNode;
    shouldDisplaySectionHeaders?: boolean;
    onMenuItemClick?: () => void;
    selectedVersion?: string;
    versions?: string[];
    onVersionSelected?: (semver: string) => void;
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
    },
};

export class NestedSidebarMenu extends React.Component<NestedSidebarMenuProps, NestedSidebarMenuState> {
    public static defaultProps: Partial<NestedSidebarMenuProps> = {
        shouldDisplaySectionHeaders: true,
        onMenuItemClick: _.noop,
    };
    public render(): React.ReactNode {
        const navigation = _.map(this.props.topLevelMenu, (menuItems: string[], sectionName: string) => {
            const finalSectionName = utils.convertDashesToSpaces(sectionName);
            if (this.props.shouldDisplaySectionHeaders) {
                const id = utils.getIdFromName(sectionName);
                return (
                    <div key={`section-${sectionName}`} className="py1" style={{ color: colors.grey800 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 15 }} className="py1">
                            {finalSectionName.toUpperCase()}
                        </div>
                        {this._renderMenuItems(menuItems)}
                    </div>
                );
            } else {
                return <div key={`section-${sectionName}`}>{this._renderMenuItems(menuItems)}</div>;
            }
        });
        const maxWidthWithScrollbar = 307;
        return (
            <div>
                {this.props.sidebarHeader}
                {!_.isUndefined(this.props.versions) &&
                    !_.isUndefined(this.props.selectedVersion) &&
                    !_.isUndefined(this.props.onVersionSelected) && (
                        <div style={{ maxWidth: maxWidthWithScrollbar }}>
                            <VersionDropDown
                                selectedVersion={this.props.selectedVersion}
                                versions={this.props.versions}
                                onVersionSelected={this.props.onVersionSelected}
                            />
                        </div>
                    )}
                <div className="pl1">{navigation}</div>
            </div>
        );
    }
    private _renderMenuItems(menuItemNames: string[]): React.ReactNode[] {
        const menuItemStyles = this.props.shouldDisplaySectionHeaders
            ? styles.menuItemWithHeaders
            : styles.menuItemWithoutHeaders;
        const menuItemInnerDivStyles = this.props.shouldDisplaySectionHeaders ? styles.menuItemInnerDivWithHeaders : {};
        const menuItems = _.map(menuItemNames, menuItemName => {
            const finalMenuItemName = utils.convertDashesToSpaces(menuItemName);
            const id = utils.getIdFromName(menuItemName);
            return (
                <div key={menuItemName}>
                    <ScrollLink
                        key={`menuItem-${menuItemName}`}
                        to={id}
                        offset={-10}
                        duration={constants.DOCS_SCROLL_DURATION_MS}
                        containerId={constants.DOCS_CONTAINER_ID}
                    >
                        <MenuItem
                            onTouchTap={this._onMenuItemClick.bind(this, finalMenuItemName)}
                            style={menuItemStyles}
                            innerDivStyle={menuItemInnerDivStyles}
                        >
                            <span style={{ textTransform: 'capitalize' }}>{finalMenuItemName}</span>
                        </MenuItem>
                    </ScrollLink>
                    {this._renderMenuItemSubsections(menuItemName)}
                </div>
            );
        });
        return menuItems;
    }
    private _renderMenuItemSubsections(menuItemName: string): React.ReactNode {
        if (_.isUndefined(this.props.menuSubsectionsBySection[menuItemName])) {
            return null;
        }
        return this._renderMenuSubsectionsBySection(menuItemName, this.props.menuSubsectionsBySection[menuItemName]);
    }
    private _renderMenuSubsectionsBySection(menuItemName: string, entityNames: string[]): React.ReactNode {
        return (
            <ul style={{ margin: 0, listStyleType: 'none', paddingLeft: 0 }} key={menuItemName}>
                {_.map(entityNames, entityName => {
                    const name = `${menuItemName}-${entityName}`;
                    const id = utils.getIdFromName(name);
                    return (
                        <li key={`menuSubsectionItem-${name}`}>
                            <ScrollLink
                                to={id}
                                offset={0}
                                duration={constants.DOCS_SCROLL_DURATION_MS}
                                containerId={constants.DOCS_CONTAINER_ID}
                                onTouchTap={this._onMenuItemClick.bind(this, name)}
                            >
                                <MenuItem
                                    onTouchTap={this._onMenuItemClick.bind(this, name)}
                                    style={{ minHeight: 35 }}
                                    innerDivStyle={{
                                        paddingLeft: 16,
                                        fontSize: 14,
                                        lineHeight: '35px',
                                    }}
                                >
                                    {entityName}
                                </MenuItem>
                            </ScrollLink>
                        </li>
                    );
                })}
            </ul>
        );
    }
    private _onMenuItemClick(name: string): void {
        const id = utils.getIdFromName(name);
        utils.setUrlHash(id);
        if (!_.isUndefined(this.props.onMenuItemClick)) {
            this.props.onMenuItemClick();
        }
    }
}
