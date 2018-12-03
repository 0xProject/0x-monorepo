import { StandardRelayerAPIOrderProvider } from '@0x/asset-buyer';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { assetDataUtils } from '@0x/order-utils';
import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import Slider from 'material-ui/Slider';
import * as React from 'react';

import { CheckMark } from 'ts/components/ui/check_mark';
import { Container } from 'ts/components/ui/container';
import { MultiSelect } from 'ts/components/ui/multi_select';
import { Select, SelectItemConfig } from 'ts/components/ui/select';
import { Spinner } from 'ts/components/ui/spinner';
import { Text } from 'ts/components/ui/text';
import { ConfigGeneratorAddressInput } from 'ts/pages/instant/config_generator_address_input';
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

export class ConfigGenerator extends React.Component<ConfigGeneratorProps, ConfigGeneratorState> {
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
            <Container minWidth="350px">
                <ConfigGeneratorSection title="Standard relayer API endpoint">
                    <Select value={value.orderSource} items={this._generateItems()} />
                </ConfigGeneratorSection>
                <ConfigGeneratorSection {...this._getTokenSelectorProps()}>
                    {this._renderTokenMultiSelectOrSpinner()}
                </ConfigGeneratorSection>
                <ConfigGeneratorSection title="Transaction fee ETH address" marginBottom="10px" isOptional={true}>
                    <ConfigGeneratorAddressInput
                        value={value.affiliateInfo ? value.affiliateInfo.feeRecipient : ''}
                        onChange={this._handleAffiliateAddressChange}
                    />
                </ConfigGeneratorSection>
                <ConfigGeneratorSection
                    title="Fee percentage"
                    actionText="Learn more"
                    onActionTextClick={this._handleAffiliatePercentageLearnMoreClick}
                >
                    <Slider
                        min={0}
                        max={0.05}
                        step={0.0025}
                        value={value.affiliateInfo.feePercentage}
                        onChange={this._handleAffiliatePercentageChange}
                    />
                </ConfigGeneratorSection>
            </Container>
        );
    }
    private readonly _getTokenSelectorProps = (): ConfigGeneratorSectionProps => {
        if (_.isUndefined(this.props.value.availableAssetDatas)) {
            return {
                title: 'What tokens can users buy?',
                actionText: 'Unselect All',
                onActionTextClick: this._handleUnselectAllClick,
            };
        }
        return {
            title: 'What tokens can users buy?',
            actionText: 'Select All',
            onActionTextClick: this._handleSelectAllClick,
        };
    };
    private readonly _generateItems = (): SelectItemConfig[] => {
        return _.map(SRA_ENDPOINTS, endpoint => ({
            text: endpoint,
            onClick: this._handleSRASelection.bind(this, endpoint),
        }));
    };
    private readonly _getAllKnownAssetDatas = (): string[] => {
        return _.map(this.state.allKnownTokens, token => assetDataUtils.encodeERC20AssetData(token.address));
    };
    private readonly _handleAffiliatePercentageLearnMoreClick = (): void => {
        window.open('/wiki#Learn-About-Affiliate-Fees', '_blank');
    };
    private readonly _handleSRASelection = (sraEndpoint: string) => {
        const newConfig: ZeroExInstantBaseConfig = {
            ...this.props.value,
            orderSource: sraEndpoint,
        };
        this.props.onConfigChange(newConfig);
    };
    private readonly _handleAffiliateAddressChange = (address: string) => {
        const oldConfig: ZeroExInstantBaseConfig = this.props.value;
        const newConfig: ZeroExInstantBaseConfig = {
            ...oldConfig,
            affiliateInfo: {
                feeRecipient: address,
                feePercentage: oldConfig.affiliateInfo.feePercentage,
            },
        };
        this.props.onConfigChange(newConfig);
    };
    private readonly _handleAffiliatePercentageChange = (event: any, value: number) => {
        const oldConfig: ZeroExInstantBaseConfig = this.props.value;
        const newConfig: ZeroExInstantBaseConfig = {
            ...oldConfig,
            affiliateInfo: {
                feeRecipient: oldConfig.affiliateInfo.feeRecipient,
                feePercentage: value,
            },
        };
        this.props.onConfigChange(newConfig);
    };
    private readonly _handleSelectAllClick = () => {
        const newConfig: ZeroExInstantBaseConfig = {
            ...this.props.value,
            availableAssetDatas: undefined,
        };
        this.props.onConfigChange(newConfig);
    };
    private readonly _handleUnselectAllClick = () => {
        const newConfig: ZeroExInstantBaseConfig = {
            ...this.props.value,
            availableAssetDatas: [],
        };
        this.props.onConfigChange(newConfig);
    };
    private readonly _handleTokenClick = (assetData: string) => {
        const { value } = this.props;
        const { allKnownTokens } = this.state;
        let newAvailableAssetDatas: string[] = [];
        const availableAssetDatas = value.availableAssetDatas;
        if (_.isUndefined(availableAssetDatas)) {
            // It being undefined means it's all tokens.
            const allKnownAssetDatas = this._getAllKnownAssetDatas();
            newAvailableAssetDatas = _.pull(allKnownAssetDatas, assetData);
        } else if (!_.includes(availableAssetDatas, assetData)) {
            // Add it
            newAvailableAssetDatas = [...availableAssetDatas, assetData];
        } else {
            // Remove it
            newAvailableAssetDatas = _.pull(availableAssetDatas, assetData);
        }
        const newConfig: ZeroExInstantBaseConfig = {
            ...this.props.value,
            availableAssetDatas: newAvailableAssetDatas,
        };
        this.props.onConfigChange(newConfig);
    };
    private readonly _setAllKnownTokens = async (callback: () => void): Promise<void> => {
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
    private readonly _setAvailableAssetsFromOrderProvider = async (): Promise<void> => {
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
    private readonly _renderTokenMultiSelectOrSpinner = (): React.ReactNode => {
        const { value } = this.props;
        const { availableTokens, isLoadingAvailableTokens } = this.state;
        const multiSelectHeight = '200px';
        if (isLoadingAvailableTokens) {
            return (
                <Container
                    className="flex flex-column items-center justify-center"
                    height={multiSelectHeight}
                    backgroundColor={colors.white}
                    borderRadius="4px"
                    width="100%"
                >
                    <Container position="relative" left="12px" marginBottom="20px">
                        <Spinner />
                    </Container>
                    <Text fontSize="16px">Loading...</Text>
                </Container>
            );
        }
        const items = _.map(availableTokens, token => {
            const assetData = assetDataUtils.encodeERC20AssetData(token.address);
            return {
                value: assetDataUtils.encodeERC20AssetData(token.address),
                renderItemContent: (isSelected: boolean) => (
                    <Container className="flex items-center">
                        <Container marginRight="10px">
                            <CheckMark isChecked={isSelected} />
                        </Container>
                        <Text
                            fontSize="16px"
                            fontColor={isSelected ? colors.mediumBlue : colors.darkerGrey}
                            fontWeight={300}
                        >
                            <b>{token.symbol}</b> — {token.name}
                        </Text>
                    </Container>
                ),
                onClick: this._handleTokenClick.bind(this, assetData),
            };
        });
        return <MultiSelect items={items} selectedValues={value.availableAssetDatas} height={multiSelectHeight} />;
    };
}

export interface ConfigGeneratorSectionProps {
    title: string;
    actionText?: string;
    onActionTextClick?: () => void;
    isOptional?: boolean;
    marginBottom?: string;
}

export const ConfigGeneratorSection: React.StatelessComponent<ConfigGeneratorSectionProps> = ({
    title,
    actionText,
    onActionTextClick,
    isOptional,
    marginBottom,
    children,
}) => (
    <Container marginBottom={marginBottom}>
        <Container marginBottom="10px" className="flex justify-between items-center">
            <Container>
                <Text fontColor={colors.white} fontSize="16px" lineHeight="18px" display="inline">
                    {title}
                </Text>
                {isOptional && (
                    <Text fontColor={colors.grey} fontSize="16px" lineHeight="18px" display="inline">
                        {' '}
                        (optional)
                    </Text>
                )}
            </Container>
            {actionText && (
                <Text fontSize="12px" fontColor={colors.grey} onClick={onActionTextClick}>
                    {actionText}
                </Text>
            )}
        </Container>
        {children}
    </Container>
);

ConfigGeneratorSection.defaultProps = {
    marginBottom: '30px',
};
