import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as React from 'react';
import { colors } from 'ts/utils/colors';

interface FillWarningDialogProps {
    isOpen: boolean;
    onToggleDialog: (didUserCancel: boolean) => void;
}

export const FillWarningDialog = (props: FillWarningDialogProps) => {
    const didCancel = true;
    return (
        <Dialog
            title="Warning"
            titleStyle={{ fontWeight: 100, color: colors.red500 }}
            actions={[
                <FlatButton
                    key="fillWarningCancel"
                    label="Cancel"
                    onClick={() => props.onToggleDialog(didCancel)} // tslint:disable-line:jsx-no-lambda
                />,
                <FlatButton
                    key="fillWarningContinue"
                    label="Fill Order"
                    onClick={() => props.onToggleDialog(!didCancel)} // tslint:disable-line:jsx-no-lambda
                />,
            ]}
            open={props.isOpen}
            onRequestClose={() => props.onToggleDialog(didCancel)} // tslint:disable-line:jsx-no-lambda
            autoScrollBodyContent={true}
            modal={true}
        >
            <div className="pt2" style={{ color: colors.grey700 }}>
                <div>
                    At least one of the tokens in this order was not found in the token registry smart contract and may
                    be counterfeit. It is your responsibility to verify the token addresses on Etherscan (
                    <a href="https://0x.org/wiki#Verifying-Custom-Tokens" target="_blank">
                        See this how-to guide
                    </a>
                    ) before filling an order. <b>This action may result in the loss of funds</b>.
                </div>
            </div>
        </Dialog>
    );
};
