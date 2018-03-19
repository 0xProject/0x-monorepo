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

import { AssetToken } from '../../types';

import TokenSelectorItem from '../TokenSelectorItem';

import { definedTokensToIcon } from '../TokenSelectorItem/TokenSelectorItem';

interface TokenSelectorPropTypes {
    onChange?: (token: AssetToken) => void;
    selectedToken: AssetToken;
}

interface TokenMetadata {
    id: string;
    symbol: AssetToken;
    description: string;
}
class TokenSelector extends React.Component<TokenSelectorPropTypes> {
    // tslint:disable-next-line:underscore-private-and-protected
    private static defaultProps = {
        // tslint:disable-next-line:no-empty
        onChange: () => {},
    };
    private _tokens: TokenMetadata[];
    constructor(props: TokenSelectorPropTypes) {
        super(props);
        this.handleItemSelected = this.handleItemSelected.bind(this);
        this._tokens = [
            { symbol: AssetToken.ZRX, id: AssetToken.ZRX, description: '0x Token' },
            { symbol: AssetToken.BAT, id: AssetToken.BAT, description: 'Basic Attention Token' },
        ];
    }

    public handleItemSelected(event: any, item: TokenSelectorItem) {
        const { onChange } = this.props;
        onChange(item.props.symbol);
    }

    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        const fullWidth = {
            width: '100%',
        };
        const { selectedToken } = this.props;
        const dropdownItems = _.map(this._tokens, tokenItem => (
            <TokenSelectorItem
                description={tokenItem.description}
                symbol={tokenItem.symbol}
                id={tokenItem.id}
                key={tokenItem.id}
                isActive={tokenItem.symbol === selectedToken}
                onClick={this.handleItemSelected}
            />
        ));
        const currentMetadata = this._getTokenMetadata(selectedToken);
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
                        <Control hasIcons={['left', 'right']}>{activeToken}</Control>
                    </Field>
                </DropdownTrigger>
                <DropdownMenu style={fullWidth}>
                    <DropdownContent style={fullWidth}>{dropdownItems}</DropdownContent>
                </DropdownMenu>
            </Dropdown>
        );
    }

    private _getTokenMetadata(token: AssetToken): TokenMetadata {
        return _.find(this._tokens, tokenMetadata => {
            return tokenMetadata.symbol === token;
        });
    }
}

export { TokenSelector };
