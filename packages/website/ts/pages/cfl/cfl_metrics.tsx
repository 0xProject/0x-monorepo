import numeral from 'numeral';
import * as React from 'react';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';
import { Paragraph } from 'ts/components/text';
import { defaultData } from 'ts/pages/cfl/default_data';
import { Metrics, MetricValue } from 'ts/pages/cfl/metrics';
import { backendClient } from 'ts/utils/backend_client';

import { CFLMetricsPairData } from 'ts/types';

const SLIPPAGE_TOOLTIP_TEXT =
    'Percent difference between the expected price of a buy and the price at which the buy is executed.';

const CFLMetricsContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: fit-content;
    @media (max-width: 768px) {
        margin-top: 60px;
    }
    @media (min-width: 768px) {
        margin-left: 60px;
    }
`;

const PairTabsContainer = styled.div`
    display: flex;
    border: ${props => `1px solid ${props.theme.lightBgColor}`};
    padding-right: 5px;
`;

const MetricsContainer = styled.div`
    display: flex;
    margin-top: 15px;
    & div:not(:last-child) {
        margin-right: 15px;
    }
`;

const FreshnessIndicator = styled.div`
    margin-top: 10px;
`;

interface PairTabProps {
    isSelected: boolean;
}

const PairTab = styled.label<PairTabProps>`
    cursor: pointer;
    white-space: nowrap;
    background-color: ${props => (props.isSelected ? props.theme.lightBgColor : '')};
    opacity: ${props => (props.isSelected ? 1 : 0.5)};
    margin: 5px 0px 5px 5px;
    &:hover {
        background-color: ${props => props.theme.lightBgColor};
    }
    padding: 10px 17px;
    font-size: 12px;
    @media (min-width: 1024px) {
        padding: 15px 40px;
        font-size: 17px;
    }
`;

interface CFLMetricsProps {}

interface CFLMetricsState {
    cflMetricsData: CFLMetricsPairData[];
    didError: boolean;
    selectedIndex: number;
}

export class CFLMetrics extends React.Component<CFLMetricsProps, CFLMetricsState> {
    public state: CFLMetricsState = {
        didError: false,
        selectedIndex: 0,
        cflMetricsData: defaultData,
    };
    public componentDidMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._updateCFLMetricsDataAsync();
    }
    public render(): React.ReactNode {
        const { cflMetricsData, selectedIndex } = this.state;
        if (!cflMetricsData.length) {
            return null;
        }
        const quoteToken = this._getSelectedPairData().makerSymbol;
        return (
            <CFLMetricsContainer>
                <PairTabsContainer>
                    {cflMetricsData.map((data, index) => {
                        const symbol = `${data.takerSymbol} / ${data.makerSymbol}`;
                        return (
                            <PairTab
                                key={symbol}
                                isSelected={selectedIndex === index}
                                onClick={this._onTabClick.bind(this, index)}
                            >
                                {symbol}
                            </PairTab>
                        );
                    })}
                </PairTabsContainer>
                <MetricsContainer>
                    <Metrics title={`Price in ${quoteToken}`} metrics={[{ value: this._getLastPrice() }]} />
                    <Metrics title="7 day volume" metrics={[{ value: this._getVolume() }]} />
                </MetricsContainer>
                <MetricsContainer>
                    <Metrics
                        title={`7 day average slippage for $10,000`}
                        info={SLIPPAGE_TOOLTIP_TEXT}
                        metrics={this._getSlippageMetrics()}
                    />
                </MetricsContainer>
                <FreshnessIndicator>
                    <Paragraph size="small" textAlign="right">
                        Updates every 30 minutes.
                    </Paragraph>
                </FreshnessIndicator>
            </CFLMetricsContainer>
        );
    }
    private async _updateCFLMetricsDataAsync(): Promise<void> {
        try {
            const data = await backendClient.getCFLMetricsAsync();
            this.setState({
                cflMetricsData: data,
            });
        } catch (err) {
            this.setState({ didError: true });
        }
    }
    private _onTabClick(index: number): void {
        this.setState({ selectedIndex: index });
    }
    private _getSelectedPairData(): CFLMetricsPairData {
        return this.state.cflMetricsData[this.state.selectedIndex];
    }
    private _getLastPrice(): string {
        const data = this._getSelectedPairData();
        if (!data.lastTradePrice) {
            return '—';
        }
        const num = numeral(data.lastTradePrice);
        return num.format('0.00');
    }
    private _getVolume(): string {
        const data = this._getSelectedPairData();
        if (!data.volumeUSD) {
            return '—';
        }
        const num = numeral(data.volumeUSD);
        return num.format('$0,0');
    }
    private _getSlippageMetrics(): MetricValue[] {
        const data = this._getSelectedPairData();
        if (!data.exchangeAverageSlippagePercentage) {
            const placeholder = '—';
            return [
                {
                    label: <Icon name="small_0x_logo" size="natural" />,
                    value: placeholder,
                },
                {
                    label: <Icon name="small_kyber_logo" size="natural" />,
                    value: placeholder,
                },
                {
                    label: <Icon name="small_uniswap_logo" size="natural" />,
                    value: placeholder,
                },
            ];
        }
        const zeroExSlippage = data.exchangeAverageSlippagePercentage.find(
            exchangeSlippage => exchangeSlippage.exchange === 'Radar Relay',
        );
        const kyberSlippage = data.exchangeAverageSlippagePercentage.find(
            exchangeSlippage => exchangeSlippage.exchange === 'Kyber',
        );
        const uniswapSlippage = data.exchangeAverageSlippagePercentage.find(
            exchangeSlippage => exchangeSlippage.exchange === 'Uniswap',
        );
        const formatSlippage = (num: string) => numeral(num).format('0.00%');
        return [
            {
                label: <Icon name="small_0x_logo" size="natural" />,
                value: formatSlippage(zeroExSlippage.current_period_avg_slippage),
            },
            {
                label: <Icon name="small_kyber_logo" size="natural" />,
                value: formatSlippage(kyberSlippage.current_period_avg_slippage),
            },
            {
                label: <Icon name="small_uniswap_logo" size="natural" />,
                value: formatSlippage(uniswapSlippage.current_period_avg_slippage),
            },
        ];
    }
}
