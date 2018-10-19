import { colors, EtherscanLinkSuffixes, utils as sharedUtils } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import ReactTooltip = require('react-tooltip');
import { EthereumAddress } from 'ts/components/ui/ethereum_address';
import { Identicon } from 'ts/components/ui/identicon';

const IMAGE_DIMENSION = 100;
const IDENTICON_DIAMETER = 95;

interface PartyProps {
    label: string;
    address: string;
    networkId: number;
    alternativeImage?: string;
    identiconDiameter?: number;
    identiconStyle?: React.CSSProperties;
    isInTokenRegistry?: boolean;
    hasUniqueNameAndSymbol?: boolean;
}

interface PartyState {}

export class Party extends React.Component<PartyProps, PartyState> {
    public static defaultProps: Partial<PartyProps> = {
        identiconStyle: {},
        identiconDiameter: IDENTICON_DIAMETER,
    };
    public render(): React.ReactNode {
        const label = this.props.label;
        const address = this.props.address;
        const identiconDiameter = this.props.identiconDiameter;
        const emptyIdenticonStyles = {
            width: identiconDiameter,
            height: identiconDiameter,
            backgroundColor: 'lightgray',
            marginTop: 13,
            marginBottom: 10,
        };
        const tokenImageStyle = {
            width: IMAGE_DIMENSION,
            height: IMAGE_DIMENSION,
        };
        const etherscanLinkIfExists = sharedUtils.getEtherScanLinkIfExists(
            this.props.address,
            this.props.networkId,
            EtherscanLinkSuffixes.Address,
        );
        const isRegistered = this.props.isInTokenRegistry;
        const registeredTooltipId = `${this.props.address}-${isRegistered}-registeredTooltip`;
        const uniqueNameAndSymbolTooltipId = `${this.props.address}-${isRegistered}-uniqueTooltip`;
        return (
            <div style={{ overflow: 'hidden' }}>
                <div className="pb1 center">{label}</div>
                {_.isEmpty(address) ? (
                    <div className="circle mx-auto" style={emptyIdenticonStyles} />
                ) : (
                    <a href={etherscanLinkIfExists} target="_blank">
                        {isRegistered && !_.isUndefined(this.props.alternativeImage) ? (
                            <img style={tokenImageStyle} src={this.props.alternativeImage} />
                        ) : (
                            <div className="mx-auto" style={{ height: identiconDiameter, width: identiconDiameter }}>
                                <Identicon
                                    address={this.props.address}
                                    diameter={identiconDiameter}
                                    style={this.props.identiconStyle}
                                />
                            </div>
                        )}
                    </a>
                )}
                <div className="mx-auto center pt1">
                    <div style={{ height: 25 }}>
                        <EthereumAddress address={address} networkId={this.props.networkId} />
                    </div>
                    {!_.isUndefined(this.props.isInTokenRegistry) && (
                        <div>
                            <div
                                data-tip={true}
                                data-for={registeredTooltipId}
                                className="mx-auto"
                                style={{ fontSize: 13, width: 127 }}
                            >
                                <span
                                    style={{
                                        color: isRegistered ? colors.brightGreen : colors.red500,
                                    }}
                                >
                                    <i
                                        className={`zmdi ${isRegistered ? 'zmdi-check-circle' : 'zmdi-alert-triangle'}`}
                                    />
                                </span>{' '}
                                <span>{isRegistered ? 'Registered' : 'Unregistered'} token</span>
                                <ReactTooltip id={registeredTooltipId}>
                                    {isRegistered ? (
                                        <div>
                                            This token address was found in the token registry<br />
                                            smart contract and is therefore believed to be a<br />
                                            legitimate token.
                                        </div>
                                    ) : (
                                        <div>
                                            This token is not included in the token registry<br />
                                            smart contract. We cannot guarantee the legitimacy<br />
                                            of this token. Make sure to verify its address on Etherscan.
                                        </div>
                                    )}
                                </ReactTooltip>
                            </div>
                        </div>
                    )}
                    {!_.isUndefined(this.props.hasUniqueNameAndSymbol) &&
                        !this.props.hasUniqueNameAndSymbol && (
                            <div>
                                <div
                                    data-tip={true}
                                    data-for={uniqueNameAndSymbolTooltipId}
                                    className="mx-auto"
                                    style={{ fontSize: 13, width: 127 }}
                                >
                                    <span style={{ color: colors.red500 }}>
                                        <i className="zmdi zmdi-alert-octagon" />
                                    </span>{' '}
                                    <span>Suspicious token</span>
                                    <ReactTooltip id={uniqueNameAndSymbolTooltipId}>
                                        This token shares it's name, symbol or both with<br />
                                        a token in the 0x Token Registry but it has a different<br />
                                        smart contract address. This is most likely a scam token!
                                    </ReactTooltip>
                                </div>
                            </div>
                        )}
                </div>
            </div>
        );
    }
}
