import { StandardRelayerAPIOrderProvider } from '@0x/asset-buyer';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { assetDataUtils } from '@0x/order-utils';
import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';

import { CheckMark } from 'ts/components/ui/check_mark';
import { Container } from 'ts/components/ui/container';
import { MultiSelect } from 'ts/components/ui/multi_select';
import { Select, SelectItemConfig } from 'ts/components/ui/select';
import { Spinner } from 'ts/components/ui/spinner';
import { Text } from 'ts/components/ui/text';
import { ConfigGeneratorAddressInput } from 'ts/pages/instant/config_generator_address_input';
import { FeePercentageSlider } from 'ts/pages/instant/fee_percentage_slider';
import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';

// New components
import { Heading, Paragraph } from 'ts/@next/components/text';

import { assetMetaDataMap } from '../../../../../instant/src/data/asset_meta_data_map';
import { ERC20AssetMetaData, ZeroExInstantBaseConfig } from '../../../../../instant/src/types';

export interface ConfigGeneratorProps {
    value: ZeroExInstantBaseConfig;
    onConfigChange: (config: ZeroExInstantBaseConfig) => void;
}

export interface ConfigGeneratorState {
    isLoadingAvailableTokens: boolean;
    // Address to token info
    availableTokens?: ObjectMap<ERC20AssetMetaData>;
}

const SRA_ENDPOINTS = ['https://api.radarrelay.com/0x/v2/', 'https://sra.bamboorelay.com/0x/v2/'];

export class ConfigGenerator extends React.Component<ConfigGeneratorProps, ConfigGeneratorState> {
    public state: ConfigGeneratorState = {
        isLoadingAvailableTokens: true,
    };
    public componentDidMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._setAvailableAssetsFromOrderProvider();
    }
    public componentDidUpdate(prevProps: ConfigGeneratorProps): void {
        if (prevProps.value.orderSource !== this.props.value.orderSource) {
            // tslint:disable-next-line:no-floating-promises
            this._setAvailableAssetsFromOrderProvider();
            const newConfig: ZeroExInstantBaseConfig = {
                ...this.props.value,
                availableAssetDatas: undefined,
            };
            this.props.onConfigChange(newConfig);
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
                    <FeePercentageSlider
                        value={value.affiliateInfo.feePercentage}
                        onChange={this._handleAffiliatePercentageChange}
                        isDisabled={
                            _.isUndefined(value.affiliateInfo) ||
                            _.isUndefined(value.affiliateInfo.feeRecipient) ||
                            _.isEmpty(value.affiliateInfo.feeRecipient)
                        }
                    />
                </ConfigGeneratorSection>
            </Container>
        );
    }
    private readonly _getTokenSelectorProps = (): ConfigGeneratorSectionProps => {
        if (_.isEmpty(this.state.availableTokens)) {
            return {
                title: 'What tokens can users buy?',
            };
        }
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
    private readonly _handleAffiliatePercentageLearnMoreClick = (): void => {
        window.open(`${WebsitePaths.Wiki}#Learn-About-Affiliate-Fees`, '_blank');
    };
    private readonly _handleSRASelection = (sraEndpoint: string) => {
        const newConfig: ZeroExInstantBaseConfig = {
            ...this.props.value,
            orderSource: sraEndpoint,
        };
        this.props.onConfigChange(newConfig);
    };
    private readonly _handleAffiliateAddressChange = (address: string, isValid: boolean) => {
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
    private readonly _handleAffiliatePercentageChange = (value: number) => {
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
        let newAvailableAssetDatas: string[] = [];
        const allKnownAssetDatas = _.keys(this.state.availableTokens);
        const availableAssetDatas = value.availableAssetDatas;
        if (_.isUndefined(availableAssetDatas)) {
            // It being undefined means it's all tokens.
            newAvailableAssetDatas = _.pull(allKnownAssetDatas, assetData);
        } else if (!_.includes(availableAssetDatas, assetData)) {
            // Add it
            newAvailableAssetDatas = [...availableAssetDatas, assetData];
            if (newAvailableAssetDatas.length === allKnownAssetDatas.length) {
                // If all tokens are manually selected, just show none.
                newAvailableAssetDatas = undefined;
            }
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
    private readonly _setAvailableAssetsFromOrderProvider = async (): Promise<void> => {
        const { value } = this.props;
        if (!_.isUndefined(value.orderSource) && _.isString(value.orderSource)) {
            this.setState({ isLoadingAvailableTokens: true });
            const networkId = constants.NETWORK_ID_MAINNET;
            const sraOrderProvider = new StandardRelayerAPIOrderProvider(value.orderSource, networkId);
            const etherTokenAddress = getContractAddressesForNetworkOrThrow(networkId).etherToken;
            const etherTokenAssetData = assetDataUtils.encodeERC20AssetData(etherTokenAddress);
            const assetDatas = await sraOrderProvider.getAvailableMakerAssetDatasAsync(etherTokenAssetData);
            const availableTokens = _.reduce(
                assetDatas,
                (acc, assetData) => {
                    const metaDataIfExists = assetMetaDataMap[assetData] as ERC20AssetMetaData;
                    if (metaDataIfExists) {
                        acc[assetData] = metaDataIfExists;
                    }
                    return acc;
                },
                {} as ObjectMap<ERC20AssetMetaData>,
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
        const availableAssetDatas = _.keys(availableTokens);
        if (availableAssetDatas.length === 0) {
            return (
                <Container
                    className="flex flex-column items-center justify-center"
                    height={multiSelectHeight}
                    backgroundColor={colors.white}
                    borderRadius="4px"
                    width="100%"
                >
                    <Text fontSize="16px">No tokens available. Try another endpoint?</Text>
                </Container>
            );
        }
        const items = _.map(_.keys(availableTokens), assetData => {
            const metaData = availableTokens[assetData];
            return {
                value: assetData,
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
                            <b>{metaData.symbol.toUpperCase()}</b> — {metaData.name}
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
                <Heading size="small" isNoMargin={true}>
                    {title}
                </Heading>
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
