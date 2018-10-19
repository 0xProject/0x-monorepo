import { colors } from '@0x/react-shared';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as React from 'react';
import { constants } from 'ts/utils/constants';

interface U2fNotSupportedDialogProps {
    isOpen: boolean;
    onToggleDialog: () => void;
}

export const U2fNotSupportedDialog = (props: U2fNotSupportedDialogProps) => {
    return (
        <Dialog
            title="U2F Not Supported"
            titleStyle={{ fontWeight: 100 }}
            actions={[<FlatButton key="u2fNo" label="Ok" onClick={props.onToggleDialog} />]}
            open={props.isOpen}
            onRequestClose={props.onToggleDialog}
            autoScrollBodyContent={true}
        >
            <div className="pt2" style={{ color: colors.grey700 }}>
                <div>
                    It looks like your browser does not support U2F connections required for us to communicate with your
                    hardware wallet. Please use a browser that supports U2F connections and try again.
                </div>
                <div>
                    <ul>
                        <li className="pb1">Chrome version 38 or later</li>
                        <li className="pb1">Opera version 40 of later</li>
                        <li>
                            Firefox with{' '}
                            <a
                                href={constants.URL_FIREFOX_U2F_ADDON}
                                target="_blank"
                                style={{ textDecoration: 'underline' }}
                            >
                                this extension
                            </a>.
                        </li>
                    </ul>
                </div>
            </div>
        </Dialog>
    );
};
