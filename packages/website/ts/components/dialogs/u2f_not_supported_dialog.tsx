import * as React from 'react';
import {colors} from 'material-ui/styles';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import {constants} from 'ts/utils/constants';

interface U2fNotSupportedDialogProps {
    isOpen: boolean;
    onToggleDialog: () => void;
}

export function U2fNotSupportedDialog(props: U2fNotSupportedDialogProps) {
    return (
        <Dialog
            title="U2F Not Supported"
            titleStyle={{fontWeight: 100}}
            actions={[
                <FlatButton
                    label="Ok"
                    onTouchTap={props.onToggleDialog.bind(this)}
                />,
            ]}
            open={props.isOpen}
            onRequestClose={props.onToggleDialog.bind(this)}
            autoScrollBodyContent={true}
        >
            <div className="pt2" style={{color: colors.grey700}}>
                <div>
                    It looks like your browser does not support U2F connections
                    required for us to communicate with your hardware wallet.
                    Please use a browser that supports U2F connections and try
                    again.
                </div>
                <div>
                    <ul>
                        <li className="pb1">Chrome version 38 or later</li>
                        <li className="pb1">Opera version 40 of later</li>
                        <li>
                            Firefox with{' '}
                            <a
                                href={constants.FIREFOX_U2F_ADDON}
                                target="_blank"
                                style={{textDecoration: 'underline'}}
                            >
                                this extension
                            </a>.
                        </li>
                    </ul>
                </div>
            </div>
        </Dialog>
    );
}
