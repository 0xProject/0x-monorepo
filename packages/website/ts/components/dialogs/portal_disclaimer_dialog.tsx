import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as React from 'react';
import { colors } from 'ts/utils/colors';

interface PortalDisclaimerDialogProps {
    isOpen: boolean;
    onToggleDialog: () => void;
}

export const PortalDisclaimerDialog = (props: PortalDisclaimerDialogProps) => {
    return (
        <Dialog
            title="0x Portal Disclaimer"
            titleStyle={{ fontWeight: 100 }}
            actions={[<FlatButton key="portalAgree" label="I Agree" onClick={props.onToggleDialog} />]}
            open={props.isOpen}
            onRequestClose={props.onToggleDialog}
            autoScrollBodyContent={true}
            modal={true}
        >
            <div className="pt2" style={{ color: colors.grey700 }}>
                <div>
                    0x Portal is a free software-based tool intended to help users to buy and sell ERC20-compatible
                    blockchain tokens through the 0x protocol on a purely peer-to-peer basis. 0x portal is not a
                    regulated marketplace, exchange or intermediary of any kind, and therefore, you should only use 0x
                    portal to exchange tokens that are not securities, commodity interests, or any other form of
                    regulated instrument. 0x has not attempted to screen or otherwise limit the tokens that you may
                    enter in 0x Portal. By clicking “I Agree” below, you understand that you are solely responsible for
                    using 0x Portal and buying and selling tokens using 0x Portal in compliance with all applicable laws
                    and regulations.
                </div>
            </div>
        </Dialog>
    );
};
