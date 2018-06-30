import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';

import { colors } from 'ts/style/colors';
import { constants } from 'ts/utils/constants';

export interface InstallPromptProps {
    onToggleLedgerDialog: () => void;
}

export const InstallPrompt: React.StatelessComponent<InstallPromptProps> = ({ onToggleLedgerDialog }) => {
    return (
        <div className="px2" style={{ maxWidth: 420 }}>
            <div className="center h4 py2" style={{ color: colors.grey700 }}>
                Choose a wallet:
            </div>
            <div className="flex pb3">
                <div className="center px2">
                    <div style={{ color: colors.darkGrey }}>Install a browser wallet</div>
                    <div className="py2">
                        <img src="/images/metamask_or_parity.png" width="135" />
                    </div>
                    <div>
                        Use
                        <a
                            href={constants.URL_METAMASK_CHROME_STORE}
                            target="_blank"
                            style={{ color: colors.lightBlueA700 }}
                        >
                            Metamask
                        </a>
                        or
                        <a
                            href={constants.URL_PARITY_CHROME_STORE}
                            target="_blank"
                            style={{ color: colors.lightBlueA700 }}
                        >
                            Parity Signer
                        </a>
                    </div>
                </div>
                <div>
                    <div className="pl1 ml1" style={{ borderLeft: `1px solid ${colors.grey300}`, height: 65 }} />
                    <div className="py1">or</div>
                    <div className="pl1 ml1" style={{ borderLeft: `1px solid ${colors.grey300}`, height: 68 }} />
                </div>
                <div className="px2 center">
                    <div style={{ color: colors.darkGrey }}>Connect to a ledger hardware wallet</div>
                    <div style={{ paddingTop: 21, paddingBottom: 29 }}>
                        <img src="/images/ledger_icon.png" style={{ width: 80 }} />
                    </div>
                    <div>
                        <RaisedButton style={{ width: '100%' }} label="Use Ledger" onClick={onToggleLedgerDialog} />
                    </div>
                </div>
            </div>
        </div>
    );
};
