import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeaderTitle,
    Column,
    Columns,
    Container,
    Content,
    Control,
    Field,
    Input,
    Label,
    TextArea,
} from 'bloomer';
import 'bulma/css/bulma.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './index.css';

import BuyWidget from './components/BuyWidget';
import registerServiceWorker from './registerServiceWorker';

import './App.css';

class App extends React.Component {
    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        return (
            <Container style={{ marginTop: 20, marginLeft: 20 }}>
                <Content>
                    <Columns>
                        <Column isSize={{ mobile: 12, default: '1/4' }}>
                            <Card>
                                <CardHeaderTitle>
                                    <Label isSize={'small'}>0x TRADE WIDGET</Label>
                                </CardHeaderTitle>
                                <CardContent>
                                    <BuyWidget />
                                </CardContent>
                            </Card>
                        </Column>
                    </Columns>
                </Content>
            </Container>
        );
    }
}

// tslint:disable-next-line:no-default-export
export default App;
