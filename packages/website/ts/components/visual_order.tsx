import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { Party } from 'ts/components/ui/party';
import { AssetToken, Token, TokenByAddress } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { utils } from 'ts/utils/utils';

interface VisualOrderProps {
    makerAssetToken: AssetToken;
    takerAssetToken: AssetToken;
    makerToken: Token;
    takerToken: Token;
    networkId: number;
    tokenByAddress: TokenByAddress;
    isMakerTokenAddressInRegistry: boolean;
    isTakerTokenAddressInRegistry: boolean;
}

interface VisualOrderState {}

export class VisualOrder extends React.Component<VisualOrderProps, VisualOrderState> {
    public render(): React.ReactNode {
        const allTokens = _.values(this.props.tokenByAddress);
        const makerImage = this.props.makerToken.iconUrl;
        const takerImage = this.props.takerToken.iconUrl;
        return (
            <div>
                <div className="clearfix">
                    <div className="col col-5 center">
                        <Party
                            label="Send"
                            address={this.props.takerToken.address}
                            alternativeImage={takerImage}
                            networkId={this.props.networkId}
                            isInTokenRegistry={this.props.isTakerTokenAddressInRegistry}
                            hasUniqueNameAndSymbol={utils.hasUniqueNameAndSymbol(allTokens, this.props.takerToken)}
                        />
                    </div>
                    <div className="col col-2 center pt1">
                        <div className="pb1">
                            {this._renderAmount(this.props.takerAssetToken, this.props.takerToken)}
                        </div>
                        <div className="lg-p2 md-p2 sm-p1">
                            <img src="/images/trade_arrows.png" style={{ width: 47 }} />
                        </div>
                        <div className="pt1">
                            {this._renderAmount(this.props.makerAssetToken, this.props.makerToken)}
                        </div>
                    </div>
                    <div className="col col-5 center">
                        <Party
                            label="Receive"
                            address={this.props.makerToken.address}
                            alternativeImage={makerImage}
                            networkId={this.props.networkId}
                            isInTokenRegistry={this.props.isMakerTokenAddressInRegistry}
                            hasUniqueNameAndSymbol={utils.hasUniqueNameAndSymbol(allTokens, this.props.makerToken)}
                        />
                    </div>
                </div>
            </div>
        );
    }
    private _renderAmount(assetToken: AssetToken, token: Token): React.ReactNode {
        const unitAmount = Web3Wrapper.toUnitAmount(assetToken.amount, token.decimals);
        return (
            <div style={{ fontSize: 13 }}>
                {unitAmount.toNumber().toFixed(configs.AMOUNT_DISPLAY_PRECSION)} {token.symbol}
            </div>
        );
    }
}
