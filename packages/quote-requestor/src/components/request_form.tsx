import * as React from 'react';
import { FormGroup, InputGroup, Card, Elevation, NumericInput, HTMLSelect, Button } from '@blueprintjs/core';

interface RequestFormState {
    sellToken: string;
    sellAmount: number;
    buyToken: string;
    rfqtUrl: string;
    apiKey: string;
}
export class RequestForm extends React.PureComponent<{}, RequestFormState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            sellToken: 'WETH',
            buyToken: 'USDC',
            sellAmount: 1,
            rfqtUrl: '',
            apiKey: '',
        };
        this.handleSellAmountChange = this.handleSellAmountChange.bind(this);
        this.handleSellTokenChange = this.handleSellTokenChange.bind(this);
        this.handleBuyTokenChange = this.handleBuyTokenChange.bind(this);
        this.handleRfqtUrlChange = this.handleRfqtUrlChange.bind(this);
        this.handleApiKeyChange = this.handleApiKeyChange.bind(this);
    }
    handleSellAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ sellAmount: parseFloat(event.target.value) });
    }
    handleSellTokenChange(event: React.ChangeEvent<HTMLSelectElement>) {
        this.setState({ sellToken: event.target.value, buyToken: this.state.sellToken });
    }
    handleBuyTokenChange(event: React.ChangeEvent<HTMLSelectElement>) {
        this.setState({ buyToken: event.target.value, sellToken: this.state.buyToken });
    }
    handleRfqtUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ rfqtUrl: event.target.value });
    }
    handleApiKeyChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ apiKey: event.target.value });
    }
    public render() {
        return (
            <Card interactive={false} elevation={Elevation.ONE} style={{ height: '355px', width: '250px' }}>
                <FormGroup label="Sell" inline={false} style={{ float: 'left' }}>
                    <NumericInput
                        id="sell-amount"
                        onChange={this.handleSellAmountChange}
                        value={this.state.sellAmount}
                        style={{ float: 'left', width: '75px' }}
                        min={0}
                    />
                </FormGroup>
                <FormGroup label="&nbsp;" style={{ float: 'left', marginRight: '10px' }}>
                    <HTMLSelect
                        onChange={this.handleSellTokenChange}
                        value={this.state.sellToken}
                        style={{ float: 'left' }}
                    >
                        <option value="USDC">USDC</option>
                        <option value="WETH">WETH</option>
                    </HTMLSelect>
                </FormGroup>
                <FormGroup label="Receive" inline={false} style={{ float: 'left' }}>
                    <HTMLSelect onChange={this.handleBuyTokenChange} value={this.state.buyToken}>
                        <option value="USDC">USDC</option>
                        <option value="WETH">WETH</option>
                    </HTMLSelect>
                </FormGroup>
                <FormGroup label="RFQT Server URI" inline={false} style={{ float: 'left' }}>
                    <InputGroup
                        id="rfqt-url"
                        placeholder="i.e. http://127.0.0.1:4000"
                        onChange={this.handleRfqtUrlChange}
                        value={this.state.rfqtUrl}
                    />
                </FormGroup>
                <FormGroup label="API key" inline={false} style={{ float: 'left' }}>
                    <InputGroup
                        id="api-key"
                        placeholder="i.e. vj302-3vbv23r32-505353"
                        onChange={this.handleApiKeyChange}
                        value={this.state.apiKey}
                    />
                </FormGroup>
                <FormGroup inline={false} style={{ clear: 'both' }}>
                    <Button
                        type="submit"
                        intent="primary"
                        fill={true}
                        style={{ backgroundColor: 'white', color: 'black' }}
                    >
                        Request
                    </Button>
                </FormGroup>
            </Card>
        );
    }
}
