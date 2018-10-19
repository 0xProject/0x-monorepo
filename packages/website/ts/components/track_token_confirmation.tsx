import { colors } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Party } from 'ts/components/ui/party';
import { Token, TokenByAddress } from 'ts/types';
import { utils } from 'ts/utils/utils';

interface TrackTokenConfirmationProps {
    tokens: Token[];
    tokenByAddress: TokenByAddress;
    networkId: number;
    isAddingTokenToTracked: boolean;
}

interface TrackTokenConfirmationState {}

export class TrackTokenConfirmation extends React.Component<TrackTokenConfirmationProps, TrackTokenConfirmationState> {
    public render(): React.ReactNode {
        const isMultipleTokens = this.props.tokens.length > 1;
        const allTokens = _.values(this.props.tokenByAddress);
        return (
            <div style={{ color: colors.grey700 }}>
                {this.props.isAddingTokenToTracked ? (
                    <div className="py4 my4 center">
                        <span className="pr1">
                            <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                        </span>
                        <span>Adding token{isMultipleTokens && 's'}...</span>
                    </div>
                ) : (
                    <div>
                        <div>You do not currently track the following token{isMultipleTokens && 's'}:</div>
                        <div className="py2 clearfix mx-auto center" style={{ width: 355 }}>
                            {_.map(this.props.tokens, (token: Token) => (
                                <div
                                    key={`token-profile-${token.name}`}
                                    className={`col col-${isMultipleTokens ? '6' : '12'} px2`}
                                >
                                    <Party
                                        label={token.name}
                                        address={token.address}
                                        networkId={this.props.networkId}
                                        alternativeImage={token.iconUrl}
                                        isInTokenRegistry={token.isRegistered}
                                        hasUniqueNameAndSymbol={utils.hasUniqueNameAndSymbol(allTokens, token)}
                                    />
                                </div>
                            ))}
                        </div>
                        <div>
                            Tracking a token adds it to the balances section of 0x Portal and allows you to
                            generate/fill orders involving the token
                            {isMultipleTokens && 's'}. Would you like to start tracking{' '}
                            {isMultipleTokens ? 'these' : 'this'} token?
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
