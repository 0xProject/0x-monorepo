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
    shouldDisplaySectionHeaders?: boolean;
    onMenuItemClick?: () => void;
    selectedVersion?: string;
    versions?: string[];
    docPath?: string;
    isSectionHeaderClickable?: boolean;
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
        lineHeight: 2,
    },
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
                    <div key={`section-${sectionName}`} className="py1">
                        <ScrollLink
                            to={id}
                            offset={-20}
                            duration={constants.DOCS_SCROLL_DURATION_MS}
                            containerId={constants.DOCS_CONTAINER_ID}
                        >
                            <div style={{ color: colors.grey, cursor: 'pointer' }} className="pb1">
                                {finalSectionName.toUpperCase()}
                            </div>
                        </ScrollLink>
                        {this._renderMenuItems(menuItems)}
                    </div>
                );
            } else {
                return <div key={`section-${sectionName}`}>{this._renderMenuItems(menuItems)}</div>;
            }
        });
        return (
            <div>
                {!_.isUndefined(this.props.versions) &&
                    !_.isUndefined(this.props.selectedVersion) &&
                    !_.isUndefined(this.props.docPath) && (
                        <VersionDropDown
                            selectedVersion={this.props.selectedVersion}
                            versions={this.props.versions}
                            docPath={this.props.docPath}
                        />
                    )}
                {navigation}
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
                                        paddingLeft: 36,
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
