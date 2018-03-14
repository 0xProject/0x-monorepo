import {
    Button,
    Column,
    Columns,
    Content,
    Control,
    Dropdown,
    DropdownContent,
    DropdownDivider,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Field,
    Icon,
    Image,
    Label,
    Select,
} from 'bloomer';
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import TokenSelectorItem from '../TokenSelectorItem';

import { definedTokensToIcon } from '../TokenSelectorItem/TokenSelectorItem';

interface TokenSelectorPropTypes {
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface TokenSelectorState {
    selectedToken: string;
    active: boolean;
}

interface TokenMetadata {
    id: string;
    symbol: string;
    description: string;
}

class TokenSelector extends React.Component<TokenSelectorPropTypes, TokenSelectorState> {
    // tslint:disable-next-line:underscore-private-and-protected
    private static defaultProps = {
        // tslint:disable-next-line:no-empty
        onChange: () => {},
    };
    private _tokens: TokenMetadata[];
    constructor(props: TokenSelectorPropTypes) {
        super(props);
        this.state = { active: false, selectedToken: 'ZRX' };
        this.handleItemSelected = this.handleItemSelected.bind(this);
        this._tokens = [
            { symbol: 'ZRX', id: 'ZRX', description: '0x Token' },
            { symbol: 'BAT', id: 'BAT', description: 'Basic Attention Token' },
        ];
    }

    public handleItemSelected(item: TokenSelectorItem, event: any) {
        const { onChange } = this.props;
        onChange(event);
        this.setState((prev, props) => {
            return { ...prev, active: false, selectedToken: item.props.id };
        });
    }

    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        const fullWidth = {
            width: '100%',
        };
        const dropdownItems = _.map(this._tokens, tokenItem => (
            <TokenSelectorItem
                description={tokenItem.description}
                symbol={tokenItem.symbol}
                id={tokenItem.id}
                key={tokenItem.id}
                onClick={this.handleItemSelected}
            />
        ));
        const currentMetadata = this._getTokenMetadata(this.state.selectedToken);
        const currentIcon = definedTokensToIcon[currentMetadata.symbol];
        const activeToken = (
            <Button className={'select is-fullwidth'}>
                <Label style={{ paddingTop: '5px' }} isSize={'small'}>
                    {currentMetadata.symbol} - {currentMetadata.description}
                </Label>
                {currentIcon}
            </Button>
        );
        return (
            <Dropdown isHoverable={true} style={fullWidth}>
                <DropdownTrigger style={fullWidth}>
                    <Field>
                        <Control hasIcons={['left', 'right']}>
                            {activeToken}
                        </Control>
                    </Field>
                </DropdownTrigger>
                <DropdownMenu style={fullWidth}>
                    <DropdownContent style={fullWidth}>{dropdownItems}</DropdownContent>
                </DropdownMenu>
            </Dropdown>
        );
    }

    private _getTokenMetadata(symbol: string): TokenMetadata {
        return _.find(this._tokens, tokenMetadata => {
            return tokenMetadata.symbol === symbol;
        });
    }
}

export { TokenSelector };
