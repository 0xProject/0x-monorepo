import * as _ from 'lodash';
import * as React from 'react';

import { Blockchain } from 'ts/blockchain';
import { defaultMenuItemEntries, Menu } from 'ts/components/portal/menu';
import { Identicon } from 'ts/components/ui/identicon';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { ProviderType, Styles, WebsitePaths } from 'ts/types';
import { utils } from 'ts/utils/utils';

const IDENTICON_DIAMETER = 45;
const BORDER_RADIUS = '50%';

const styles: Styles = {
    root: {
        backgroundColor: colors.drawerMenuBackground,
        width: '100%',
        height: '100%',
    },
    identicon: {
        borderWidth: 3,
        borderStyle: 'solid',
        borderColor: colors.white,
        borderRadius: BORDER_RADIUS,
        MozBorderRadius: BORDER_RADIUS,
        WebkitBorderRadius: BORDER_RADIUS,
    },
};

export interface DrawerMenuProps {
    selectedPath?: string;
    userAddress?: string;
    injectedProviderName: string;
    providerType: ProviderType;
    blockchain?: Blockchain;
    blockchainIsLoaded: boolean;
}
export const DrawerMenu = (props: DrawerMenuProps) => {
    const relayerItemEntry = {
        to: WebsitePaths.Portal,
        labelText: 'Relayer ecosystem',
        iconName: 'zmdi-portable-wifi',
    };
    const menuItemEntries = _.concat(relayerItemEntry, defaultMenuItemEntries);
    const accountState = utils.getAccountState(
        props.blockchainIsLoaded && props.blockchain !== undefined,
        props.providerType,
        props.injectedProviderName,
        props.userAddress,
    );
    const displayMessage = utils.getReadableAccountState(accountState, props.userAddress);
    return (
        <div style={styles.root}>
            <Header userAddress={props.userAddress} displayMessage={displayMessage} />
            <Menu selectedPath={props.selectedPath} menuItemEntries={menuItemEntries} />
        </div>
    );
};

interface HeaderProps {
    userAddress?: string;
    displayMessage: string;
}
const Header = (props: HeaderProps) => {
    return (
        <div className="flex flex-center py4">
            <div className="flex flex-column mx-auto items-center">
                <Identicon address={props.userAddress} diameter={IDENTICON_DIAMETER} style={styles.identicon} />
                <Text className="pt2" fontColor={colors.white}>
                    {props.displayMessage}
                </Text>
            </div>
        </div>
    );
};
