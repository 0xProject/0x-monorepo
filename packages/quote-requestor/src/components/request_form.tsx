import * as React from 'react';
import { FormGroup, InputGroup, Card, Elevation, NumericInput, HTMLSelect, Button } from '@blueprintjs/core';

interface RequestFormState {
    sellToken: string;
    sellAmount: number;
    buyToken: string;
    rfqtUrl: string;
    apiKey: string;
    takerAddress: string;
}
interface RequestFormProps {
    onSubmit: (state: RequestFormState) => any;
}
export class RequestForm extends React.PureComponent<RequestFormProps, RequestFormState> {
    constructor(props: RequestFormProps) {
        console.log(process.env);
        console.log(process.env.TEST);
        super(props);
        this.state = {
            sellToken: 'WETH',
            buyToken: 'USDC',
            sellAmount: 1,
            rfqtUrl: '',
            apiKey: '',
            takerAddress: '',
        };
        this.handleSellAmountChange = this.handleSellAmountChange.bind(this);
        this.handleSellTokenChange = this.handleSellTokenChange.bind(this);
        this.handleBuyTokenChange = this.handleBuyTokenChange.bind(this);
        this.handleRfqtUrlChange = this.handleRfqtUrlChange.bind(this);
        this.handleApiKeyChange = this.handleApiKeyChange.bind(this);
        this.handleTakerAddressChange = this.handleTakerAddressChange.bind(this);
        this.handleSubmitButton = this.handleSubmitButton.bind(this);
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
    handleTakerAddressChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ takerAddress: event.target.value });
    }
    handleSubmitButton() {
        this.props.onSubmit(this.state);
    }
    public render() {
        return (
            <Card
                interactive={false}
                elevation={Elevation.ONE}
                style={{ height: '400px', width: '250px', float: 'left', marginRight: '20px', marginBottom: '20px' }}
            >
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
                <FormGroup label="Taker address" inline={false} style={{ float: 'left' }}>
                    <InputGroup
                        id="taker address"
                        placeholder="i.e. 0x3c96ec79fdd18794909630d147bcff7dd2e4f602"
                        onChange={this.handleTakerAddressChange}
                        value={this.state.takerAddress}
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
                        onClick={this.handleSubmitButton}
                        style={{ backgroundColor: 'white', color: 'black' }}
                    >
                        Request
                    </Button>
                </FormGroup>
            </Card>
        );
    }
}
