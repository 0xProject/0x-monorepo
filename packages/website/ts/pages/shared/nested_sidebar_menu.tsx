import * as _ from 'lodash';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { VersionDropDown } from 'ts/pages/shared/version_drop_down';
import { MenuSubsectionsBySection, Styles } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

interface NestedSidebarMenuProps {
    topLevelMenu: { [topLevel: string]: string[] };
    menuSubsectionsBySection: MenuSubsectionsBySection;
    title: string;
    shouldDisplaySectionHeaders?: boolean;
    onMenuItemClick?: () => void;
    selectedVersion?: string;
    versions?: string[];
}

interface NestedSidebarMenuState {}

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

const titleToIcon: { [title: string]: string } = {
    '0x.js': 'zeroExJs.png',
    '0x Connect': 'connect.png',
    '0x Smart Contracts': 'contracts.png',
    Wiki: 'wiki.png',
};

export class NestedSidebarMenu extends React.Component<NestedSidebarMenuProps, NestedSidebarMenuState> {
    public static defaultProps: Partial<NestedSidebarMenuProps> = {
        shouldDisplaySectionHeaders: true,
        onMenuItemClick: _.noop,
    };
    public render() {
        const navigation = _.map(this.props.topLevelMenu, (menuItems: string[], sectionName: string) => {
            const finalSectionName = sectionName.replace(/-/g, ' ');
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
        return (
            <div>
                {this._renderEmblem()}
                {!_.isUndefined(this.props.versions) &&
                    !_.isUndefined(this.props.selectedVersion) && (
                        <VersionDropDown selectedVersion={this.props.selectedVersion} versions={this.props.versions} />
                    )}
                <div className="pl1">{navigation}</div>
            </div>
        );
    }
    private _renderEmblem() {
        return (
            <div className="pt2 md-px1 sm-px2" style={{ color: colors.black, paddingBottom: 18 }}>
                <div className="flex" style={{ fontSize: 25 }}>
                    <div className="robotoMono" style={{ fontWeight: 'bold' }}>
                        0x
                    </div>
                    <div className="pl2" style={{ lineHeight: 1.4, fontWeight: 300 }}>
                        docs
                    </div>
                </div>
                <div className="pl1" style={{ color: colors.grey350, paddingBottom: 9, paddingLeft: 10, height: 17 }}>
                    |
                </div>
                <div className="flex">
                    <div>
                        <img src={`/images/doc_icons/${titleToIcon[this.props.title]}`} width="22" />
                    </div>
                    <div className="pl1" style={{ fontWeight: 600, fontSize: 20, lineHeight: 1.2 }}>
                        {this.props.title}
                    </div>
                </div>
            </div>
        );
    }
    private _renderMenuItems(menuItemNames: string[]): React.ReactNode[] {
        const menuItemStyles = this.props.shouldDisplaySectionHeaders
            ? styles.menuItemWithHeaders
            : styles.menuItemWithoutHeaders;
        const menuItemInnerDivStyles = this.props.shouldDisplaySectionHeaders ? styles.menuItemInnerDivWithHeaders : {};
        const menuItems = _.map(menuItemNames, menuItemName => {
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
                            onTouchTap={this._onMenuItemClick.bind(this, menuItemName)}
                            style={menuItemStyles}
                            innerDivStyle={menuItemInnerDivStyles}
                        >
                            <span style={{ textTransform: 'capitalize' }}>{menuItemName}</span>
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
                        <li key={`menuItem-${entityName}`}>
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
        this.props.onMenuItemClick();
    }
}
