import { StandardRelayerAPIOrderProvider } from '@0x/asset-buyer';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { assetDataUtils } from '@0x/order-utils';
import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { MultiSelect } from 'ts/components/ui/multi_select';
import { Select, SelectItemConfig } from 'ts/components/ui/select';
import { Spinner } from 'ts/components/ui/spinner';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { WebsiteBackendTokenInfo } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';
import { constants } from 'ts/utils/constants';

import { ZeroExInstantBaseConfig } from '../../../../instant/src/types';

export interface ConfigGeneratorProps {
    value: ZeroExInstantBaseConfig;
    onConfigChange: (config: ZeroExInstantBaseConfig) => void;
}

export interface ConfigGeneratorState {
    isLoadingAvailableTokens: boolean;
    // Address to token info
    allKnownTokens: ObjectMap<WebsiteBackendTokenInfo>;
    availableTokens?: WebsiteBackendTokenInfo[];
}

const SRA_ENDPOINTS = ['https://api.radarrelay.com/0x/v2/', 'https://api.openrelay.xyz/v2/'];

export class ConfigGenerator extends React.Component<ConfigGeneratorProps> {
    public state: ConfigGeneratorState = {
        isLoadingAvailableTokens: true,
        allKnownTokens: {},
    };
    public componentDidMount(): void {
        this._setAllKnownTokens(this._setAvailableAssetsFromOrderProvider);
    }
    public componentDidUpdate(prevProps: ConfigGeneratorProps): void {
        if (prevProps.value.orderSource !== this.props.value.orderSource) {
            this._setAvailableAssetsFromOrderProvider();
        }
    }
    public render(): React.ReactNode {
        const { value } = this.props;
        if (!_.isString(value.orderSource)) {
            throw new Error('ConfigGenerator component only supports string values as an orderSource.');
        }
        return (
            <Container>
                <ConfigGeneratorSection title="Standard Relayer API Endpoint">
                    <Select value={value.orderSource} items={this._generateItems()} />
                </ConfigGeneratorSection>
                <ConfigGeneratorSection title="What tokens can users buy?">
                    {this._renderTokenMultiSelectOrSpinner()}
                </ConfigGeneratorSection>
            </Container>
        );
    }
    private readonly _generateItems = (): SelectItemConfig[] => {
        return _.map(SRA_ENDPOINTS, endpoint => ({
            text: endpoint,
            onClick: this._handleSRASelection.bind(this, endpoint),
        }));
    };
    private readonly _handleSRASelection = (sraEndpoint: string) => {
        const newConfig = {
            ...this.props.value,
            orderSource: sraEndpoint,
        };
        this.props.onConfigChange(newConfig);
    };
    private readonly _handleTokenClick = (assetData: string) => {
        const { value } = this.props;
        let newAvailableAssetDatas = [];
        if (_.includes(value.availableAssetDatas, assetData)) {
            // Add it
            newAvailableAssetDatas = [...value.availableAssetDatas, assetData];
        } else {
            // Remove it
            newAvailableAssetDatas = _.remove(value.availableAssetDatas, assetData);
        }
        const newConfig = {
            ...this.props.value,
            availableAssetDatas: newAvailableAssetDatas,
        };
        this.props.onConfigChange(newConfig);
    };
    private _setAllKnownTokens = async (callback: () => void): Promise<void> => {
        const tokenInfos = await backendClient.getTokenInfosAsync();
        const allKnownTokens = _.reduce(
            tokenInfos,
            (acc, tokenInfo) => {
                acc[tokenInfo.address] = tokenInfo;
                return acc;
            },
            {} as ObjectMap<WebsiteBackendTokenInfo>,
        );
        this.setState({ allKnownTokens }, callback);
    };
    private _setAvailableAssetsFromOrderProvider = async (): Promise<void> => {
        const { value } = this.props;
        if (!_.isUndefined(value.orderSource) && _.isString(value.orderSource)) {
            this.setState({ isLoadingAvailableTokens: true });
            const networkId = constants.NETWORK_ID_MAINNET;
            const sraOrderProvider = new StandardRelayerAPIOrderProvider(value.orderSource, networkId);
            const etherTokenAddress = getContractAddressesForNetworkOrThrow(networkId).etherToken;
            const etherTokenAssetData = assetDataUtils.encodeERC20AssetData(etherTokenAddress);
            const assetDatas = await sraOrderProvider.getAvailableMakerAssetDatasAsync(etherTokenAssetData);
            const availableTokens = _.compact(
                _.map(assetDatas, assetData => {
                    const address = assetDataUtils.decodeAssetDataOrThrow(assetData).tokenAddress;
                    return this.state.allKnownTokens[address];
                }),
            );
            this.setState({ availableTokens, isLoadingAvailableTokens: false });
        }
    };
    private _renderTokenMultiSelectOrSpinner = (): React.ReactNode => {
        const { value } = this.props;
        const { availableTokens, isLoadingAvailableTokens } = this.state;
        if (isLoadingAvailableTokens) {
            return (
                <Container className="flex items-center">
                    <Spinner />
                </Container>
            );
        }
        const items = _.map(availableTokens, token => {
            const assetData = assetDataUtils.encodeERC20AssetData(token.address);
            return {
                value: assetDataUtils.encodeERC20AssetData(token.address),
                displayText: (
                    <Text>
                        <b>{token.symbol}</b> - {token.name}
                    </Text>
                ),
                onClick: this._handleTokenClick.bind(this, assetData),
            };
        });
        return <MultiSelect items={items} selectedValues={value.availableAssetDatas || []} />;
    };
}

export interface ConfigGeneratorSectionProps {
    title: string;
    actionText?: string;
    onActionTextClick?: () => void;
}

export const ConfigGeneratorSection: React.StatelessComponent<ConfigGeneratorSectionProps> = props => (
    <Container marginBottom="30px">
        <Container marginBottom="10px">
            <Text fontColor={colors.white} fontSize="16px" lineHeight="18px">
                {props.title}
            </Text>
        </Container>
        {props.children}
    </Container>
);
