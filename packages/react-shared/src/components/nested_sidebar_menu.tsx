import { ObjectMap } from '@0xproject/types';
import * as _ from 'lodash';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';

import { ALink, Styles } from '../types';
import { colors } from '../utils/colors';
import { constants } from '../utils/constants';
import { utils } from '../utils/utils';

import { Link } from './Link';
import { VersionDropDown } from './version_drop_down';

export interface NestedSidebarMenuProps {
    sectionNameToLinks: ObjectMap<ALink[]>;
    subsectionNameToLinks?: ObjectMap<ALink[]>;
    sidebarHeader?: React.ReactNode;
    shouldDisplaySectionHeaders?: boolean;
    onMenuItemClick?: () => void;
    selectedVersion?: string;
    versions?: string[];
    onVersionSelected?: (semver: string) => void;
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
    },
};

export class NestedSidebarMenu extends React.Component<NestedSidebarMenuProps, NestedSidebarMenuState> {
    public static defaultProps: Partial<NestedSidebarMenuProps> = {
        shouldDisplaySectionHeaders: true,
        onMenuItemClick: _.noop.bind(_),
        shouldReformatMenuItemNames: true,
        subsectionNameToLinks: {},
    };
    public render(): React.ReactNode {
        const navigation = _.map(this.props.sectionNameToLinks, (links: ALink[], sectionName: string) => {
            const finalSectionName = utils.convertCamelCaseToSpaces(sectionName);
            if (this.props.shouldDisplaySectionHeaders) {
                // tslint:disable-next-line:no-unused-variable
                return (
                    <div key={`section-${sectionName}`} className="py1" style={{ color: colors.linkSectionGrey }}>
                        <div style={{ fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 }} className="py1">
                            {finalSectionName.toUpperCase()}
                        </div>
                        {this._renderMenuItems(links)}
                    </div>
                );
            } else {
                return <div key={`section-${sectionName}`}>{this._renderMenuItems(links)}</div>;
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
                    <Link
                        to={link.to}
                        type={link.type}
                        shouldOpenInNewTab={link.shouldOpenInNewTab}
                        containerId={constants.DOCS_CONTAINER_ID}
                    >
                        <MenuItem
                            style={menuItemStyles}
                            innerDivStyle={menuItemInnerDivStyles}
                            onClick={this._onMenuItemClick.bind(this)}
                        >
                            <span
                                style={{
                                    textTransform: this.props.shouldReformatMenuItemNames ? 'capitalize' : 'none',
                                }}
                            >
                                {finalMenuItemName}
                            </span>
                        </MenuItem>
                    </Link>
                    {this._renderMenuItemSubsections(link.title)}
                </div>
            );
        });
        return menuItems;
    }
    private _renderMenuItemSubsections(menuItemName: string): React.ReactNode {
        if (
            _.isUndefined(this.props.subsectionNameToLinks) ||
            _.isUndefined(this.props.subsectionNameToLinks[menuItemName])
        ) {
            return null;
        }
        return this._renderSubsectionLinks(menuItemName, this.props.subsectionNameToLinks[menuItemName]);
    }
    private _renderSubsectionLinks(menuItemName: string, links: ALink[]): React.ReactNode {
        return (
            <ul style={{ margin: 0, listStyleType: 'none', paddingLeft: 0 }} key={menuItemName}>
                {_.map(links, link => {
                    const name = `${menuItemName}-${link.title}`;
                    return (
                        <li key={`menuSubsectionItem-${name}`}>
                            <Link
                                to={link.to}
                                type={link.type}
                                shouldOpenInNewTab={link.shouldOpenInNewTab}
                                containerId={constants.DOCS_CONTAINER_ID}
                            >
                                <MenuItem
                                    style={{ minHeight: 35 }}
                                    innerDivStyle={{
                                        paddingLeft: 16,
                                        fontSize: 14,
                                        lineHeight: '35px',
                                    }}
                                    onClick={this._onMenuItemClick.bind(this)}
                                >
                                    {link.title}
                                </MenuItem>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        );
    }
    private _onMenuItemClick(): void {
        if (!_.isUndefined(this.props.onMenuItemClick)) {
            this.props.onMenuItemClick();
        }
    }
}
