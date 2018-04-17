import { colors, Styles } from '@0xproject/react-shared';
import FlatButton from 'material-ui/FlatButton';
import ActionAccountBalanceWallet from 'material-ui/svg-icons/action/account-balance-wallet';
import * as React from 'react';

import { ProviderType } from 'ts/types';
import { constants } from 'ts/utils/constants';

export interface WalletDisconnectedItemProps {
    providerType: ProviderType;
    injectedProviderName: string;
    onToggleLedgerDialog: () => void;
}

const styles: Styles = {
    button: {
        border: colors.walletBorder,
        borderStyle: 'solid',
        borderWidth: 1,
        height: 80,
    },
    hrefAdjustment: {
        paddingTop: 20, // HACK: For some reason when we set the href prop of a FlatButton material-ui reduces the top padding
    },
    otherWalletText: {
        fontSize: 14,
        color: colors.grey500,
        textDecoration: 'underline',
    },
};

const ITEM_HEIGHT = 292;
const METAMASK_ICON_WIDTH = 35;
const LEDGER_ICON_WIDTH = 30;
const BUTTON_BOTTOM_PADDING = 80;

export const WalletDisconnectedItem: React.StatelessComponent<WalletDisconnectedItemProps> = (
    props: WalletDisconnectedItemProps,
) => {
    const isExternallyInjectedProvider =
        props.providerType === ProviderType.Injected && props.injectedProviderName !== '0x Public';
    return (
        <div className="flex flex-center">
            <div className="mx-auto">
                <div className="table" style={{ height: ITEM_HEIGHT }}>
                    <div className="table-cell align-middle">
                        <ProviderButton isExternallyInjectedProvider={isExternallyInjectedProvider} />
                        <div className="flex flex-center py2" style={{ paddingBottom: BUTTON_BOTTOM_PADDING }}>
                            <div className="mx-auto">
                                <div onClick={props.onToggleLedgerDialog} style={{ cursor: 'pointer' }}>
                                    <img src="/images/ledger_icon.png" style={{ width: LEDGER_ICON_WIDTH }} />
                                    <span className="px1" style={styles.otherWalletText}>
                                        user other wallet
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ProviderButtonProps {
    isExternallyInjectedProvider: boolean;
}

const ProviderButton: React.StatelessComponent<ProviderButtonProps> = (props: ProviderButtonProps) => (
    <FlatButton
        label={props.isExternallyInjectedProvider ? 'Please unlock account' : 'Get Metamask Wallet Extension'}
        labelStyle={{ color: colors.black }}
        labelPosition="after"
        primary={true}
        icon={<img src="/images/metamask_icon.png" width={METAMASK_ICON_WIDTH.toString()} />}
        style={props.isExternallyInjectedProvider ? styles.button : { ...styles.button, ...styles.hrefAdjustment }}
        href={props.isExternallyInjectedProvider ? undefined : constants.URL_METAMASK_CHROME_STORE}
        target={props.isExternallyInjectedProvider ? undefined : '_blank'}
        disabled={props.isExternallyInjectedProvider}
    />
);
