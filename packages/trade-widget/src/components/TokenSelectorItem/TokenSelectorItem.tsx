import {
    Button,
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
} from 'bloomer';
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const definedTokensToIcon: { [index: string]: JSX.Element } = {
    BAT: (
        <span className="icon-BAT_icon is-left icon">
            <span className="path1" />
            <span className="path2" />
            <span className="path3" />
            <span className="path4" />
            <span className="path5" />
        </span>
    ),
    ZRX: <span className={'icon-ZeroEx is-left icon'} />,
};

import { Token } from '../../types';
interface TokenSelectorItemPropTypes {
    id: string;
    description: string;
    symbol: Token;
    onClick: (item: TokenSelectorItem, event: any) => void;
}

class TokenSelectorItem extends React.Component<TokenSelectorItemPropTypes> {
    constructor(props: any) {
        super(props);
    }

    // tslint:disable-next-line:member-access
    public handleClicked(e: any) {
        const { onClick } = this.props;
        onClick(e, this);
    }

    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        const { id, description, symbol } = this.props;
        return (
            <div id={id}>
                <DropdownItem onClick={this.handleClicked.bind(this)} href="#">
                    <Field hasAddons={true}>
                        {definedTokensToIcon[symbol]}
                        <Control isExpanded={true} hasIcons={'left'}>
                            <Label style={{ paddingLeft: '5px', paddingTop: '5px' }} isSize={'small'}>
                                {description}
                            </Label>
                        </Control>
                    </Field>
                </DropdownItem>
            </div>
        );
    }
}

export { TokenSelectorItem, definedTokensToIcon };
