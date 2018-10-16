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
    shouldReformatMenuItemNames?: boolean;
}

export interface NestedSidebarMenuState {
    scrolledToId: string;
}

const styles: Styles = {
    menuItem: {
        minHeight: 0,
        paddingLeft: 8,
        borderRadius: 6,
    },
    menuItemInnerDiv: {
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
        shouldReformatMenuItemNames: true,
    };
    private _urlIntervalCheckId: number | undefined = undefined;
    constructor(props: NestedSidebarMenuProps) {
        super(props);
        this.state = {
            scrolledToId: '',
        };
    }
    public componentDidMount(): void {
        this._urlIntervalCheckId = window.setInterval(() => {
            const scrollId = location.hash.slice(1);
            if (scrollId !== this.state.scrolledToId) {
                this.setState({
                    scrolledToId: scrollId,
                });
            }
        }, 200);
    }
    public componentWillUnmount(): void {
        window.clearInterval(this._urlIntervalCheckId);
    }
    public render(): React.ReactNode {
        const navigation = _.map(this.props.sectionNameToLinks, (links: ALink[], sectionName: string) => {
            const finalSectionName = utils.convertCamelCaseToSpaces(sectionName);
            // tslint:disable-next-line:no-unused-variable
            return (
                <div key={`section-${sectionName}`} className="py1" style={{ color: colors.greyTheme }}>
                    <div style={{ fontSize: 14, letterSpacing: 0.5 }} className="py1 pl1">
                        {finalSectionName.toUpperCase()}
                    </div>
                    {this._renderMenuItems(links)}
                </div>
            );
        });
        return (
            <div>
                {this.props.sidebarHeader}
                <div>{navigation}</div>
            </div>
        );
    }
    private _renderMenuItems(links: ALink[]): React.ReactNode[] {
        const scrolledToId = this.state.scrolledToId;
        const menuItems = _.map(links, link => {
            const finalMenuItemName = this.props.shouldReformatMenuItemNames
                ? utils.convertDashesToSpaces(link.title)
                : link.title;
            let menuItemStyle = styles.menuItem;
            let menuItemInnerDivStyle = styles.menuItemInnerDiv;
            const isScrolledTo = link.to === scrolledToId;
            if (isScrolledTo) {
                menuItemStyle = {
                    ...menuItemStyle,
                    backgroundColor: colors.lightLinkBlue,
                };
                menuItemInnerDivStyle = {
                    ...menuItemInnerDivStyle,
                    color: colors.white,
                    fontWeight: 'bold',
                };
            }
            return (
                <div key={`menuItem-${finalMenuItemName}`}>
                    <Link to={link.to} shouldOpenInNewTab={link.shouldOpenInNewTab}>
                        <MenuItem style={menuItemStyle} innerDivStyle={menuItemInnerDivStyle}>
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
