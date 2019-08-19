import numeral from 'numeral';
import * as React from 'react';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';
import { Metrics, MetricValue } from 'ts/pages/cfl/metrics';
import { backendClient } from 'ts/utils/backend_client';

import { CFLMetricsPairData } from 'ts/types';

const CFLMetricsContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: fit-content;
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

interface PairTabProps {
    isSelected: boolean;
}

const PairTab = styled.label<PairTabProps>`
    padding: 15px 40px;
    white-space: nowrap;
    font-size: 17px;
    background-color: ${props => (props.isSelected ? props.theme.lightBgColor : '')};
    opacity: ${props => (props.isSelected ? 1 : 0.5)};
    cursor: pointer;
    margin: 5px 0px 5px 5px;
    &:hover {
        background-color: ${props => props.theme.lightBgColor};
    }
`;

interface CFLMetricsProps {}

interface CFLMetricsState {
    cflMetricsData?: CFLMetricsPairData[];
    didError: boolean;
    selectedIndex: number;
}

export class CFLMetrics extends React.Component<CFLMetricsProps, CFLMetricsState> {
    public state: CFLMetricsState = {
        didError: false,
        selectedIndex: 0,
    };
    public componentDidMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._updateCFLMetricsDataAsync();
    }
    public render(): React.ReactNode {
        const { cflMetricsData, selectedIndex } = this.state;
        if (!cflMetricsData) {
            return null;
        }

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
                    <Metrics title="Last price" metrics={[{ value: this._getLastPrice() }]} />
                    <Metrics title="7 day volume" metrics={[{ value: this._getVolume() }]} />
                </MetricsContainer>
                <MetricsContainer>
                    <Metrics title="Slippage across DEXes" metrics={this._getSlippageMetrics()} />
                </MetricsContainer>
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
        const num = numeral(data.lastTradePrice);
        const formattedNum = num.format('0.00');
        const currency = data.makerSymbol;
        return `${formattedNum} ${currency}`;
    }
    private _getVolume(): string {
        const data = this._getSelectedPairData();
        const num = numeral(data.volumeUSD);
        return num.format('$0,0');
    }
    private _getSlippageMetrics(): MetricValue[] {
        const data = this._getSelectedPairData();
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
