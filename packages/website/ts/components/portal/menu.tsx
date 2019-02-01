import { Styles } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { CustomMenuItem } from 'ts/components/ui/custom_menu_item';
import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';

export interface MenuTheme {
    paddingLeft: number;
    textColor: string;
    iconColor: string;
    selectedIconColor: string;
    selectedBackgroundColor: string;
}

export interface MenuItemEntry {
    to: string;
    labelText: string;
    iconName: string;
}

export interface MenuProps {
    selectedPath?: string;
    theme?: MenuTheme;
    menuItemEntries?: MenuItemEntry[];
}

export const defaultMenuItemEntries: MenuItemEntry[] = [
    {
        to: `${WebsitePaths.Portal}/account`,
        labelText: 'Account overview',
        iconName: 'zmdi-balance-wallet',
    },
    {
        to: `${WebsitePaths.Portal}/trades`,
        labelText: 'Trade history',
        iconName: 'zmdi-format-list-bulleted',
    },
    {
        to: `${WebsitePaths.Portal}/weth`,
        labelText: 'Wrapped ETH',
        iconName: 'zmdi-circle-o',
    },
    {
        to: `${WebsitePaths.Portal}/generate`,
        labelText: 'Generate order',
        iconName: 'zmdi-arrow-right-top',
    },
    {
        to: `${WebsitePaths.Portal}/fill`,
        labelText: 'Fill order',
        iconName: 'zmdi-arrow-left-bottom',
    },
];

const DEFAULT_MENU_THEME: MenuTheme = {
    paddingLeft: 30,
    textColor: colors.white,
    iconColor: colors.white,
    selectedIconColor: colors.white,
    selectedBackgroundColor: colors.menuItemDefaultSelectedBackground,
};

export const Menu: React.StatelessComponent<MenuProps> = (props: MenuProps) => {
    return (
        <div>
            {_.map(props.menuItemEntries, entry => {
                const isSelected = entry.to === props.selectedPath;
                return (
                    <CustomMenuItem key={entry.to} to={entry.to}>
                        <MenuItemLabel
                            title={entry.labelText}
                            iconName={entry.iconName}
                            selected={isSelected}
                            theme={props.theme}
                        />
                    </CustomMenuItem>
                );
            })}
        </div>
    );
};
Menu.defaultProps = {
    theme: DEFAULT_MENU_THEME,
    menuItemEntries: defaultMenuItemEntries,
};

interface MenuItemLabelProps {
    title: string;
    iconName: string;
    selected: boolean;
    theme: MenuTheme;
}
const MenuItemLabel: React.StatelessComponent<MenuItemLabelProps> = (props: MenuItemLabelProps) => {
    const styles: Styles = {
        root: {
            backgroundColor: props.selected ? props.theme.selectedBackgroundColor : undefined,
            paddingLeft: props.theme.paddingLeft,
        },
        icon: {
            color: props.selected ? props.theme.selectedIconColor : props.theme.iconColor,
            fontSize: 20,
        },
        text: {
            color: props.theme.textColor,
            fontWeight: props.selected ? 'bold' : 'normal',
            fontSize: 16,
        },
    };
    return (
        <div className="flex py2" style={styles.root}>
            <div className="pr1">
                <i style={styles.icon} className={`zmdi ${props.iconName}`} />
            </div>
            <div className="pl1" style={styles.text}>
                {props.title}
            </div>
        </div>
    );
};
