import { generatePseudoRandomSalt } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { Side, TokenByAddress } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

interface FillOrderJSONProps {
    blockchain: Blockchain;
    tokenByAddress: TokenByAddress;
    orderJSON: string;
    onFillOrderJSONChanged: (event: any) => void;
}

interface FillOrderJSONState {}

export class FillOrderJSON extends React.Component<FillOrderJSONProps, FillOrderJSONState> {
    public render(): React.ReactNode {
        const tokenAddresses = _.keys(this.props.tokenByAddress);
        const exchangeContract = this.props.blockchain.getExchangeContractAddressIfExists();
        const hintSideToAssetToken = {
            [Side.Deposit]: {
                amount: new BigNumber(35),
                address: tokenAddresses[0],
            },
            [Side.Receive]: {
                amount: new BigNumber(89),
                address: tokenAddresses[1],
            },
        };
        const hintOrderExpiryTimestamp = utils.initialOrderExpiryUnixTimestampSec();
        const hintECSignature = '0x012761a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33';
        const hintSalt = generatePseudoRandomSalt();
        const feeRecipient = constants.NULL_ADDRESS;
        const hintOrder = utils.generateOrder(
            exchangeContract,
            hintSideToAssetToken,
            hintOrderExpiryTimestamp,
            '',
            '',
            constants.MAKER_FEE,
            constants.TAKER_FEE,
            feeRecipient,
            hintECSignature,
            this.props.tokenByAddress,
            hintSalt,
        );
        const hintOrderJSON = `${JSON.stringify(hintOrder, null, '\t').substring(0, 500)}...`;
        return (
            <div>
                <Paper className="p1 overflow-hidden" style={{ height: 164 }}>
                    <TextField
                        id="orderJSON"
                        hintStyle={{ bottom: 0, top: 0 }}
                        fullWidth={true}
                        value={this.props.orderJSON}
                        onChange={this.props.onFillOrderJSONChanged.bind(this)}
                        hintText={hintOrderJSON}
                        multiLine={true}
                        rows={6}
                        rowsMax={6}
                        underlineStyle={{ display: 'none' }}
                        textareaStyle={{ marginTop: 0 }}
                    />
                </Paper>
            </div>
        );
    }
}
