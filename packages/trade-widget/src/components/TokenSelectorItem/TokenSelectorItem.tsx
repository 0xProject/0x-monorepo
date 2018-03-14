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
interface TokenSelectorItemPropTypes {
    id: string;
    description: string;
    symbol: string;
    onClick: (item: TokenSelectorItem, event: any) => void;
}

class TokenSelectorItem extends React.Component<TokenSelectorItemPropTypes> {
    constructor(props: any) {
        super(props);
    }

    // tslint:disable-next-line:member-access
    handleClicked = (e: any) => {
        const {onClick} = this.props;
        onClick(this, e);
    }

    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        return (
            <div id={this.props.id}>
                <DropdownItem onClick={this.handleClicked} href="#">
                    <Field hasAddons={true}>
                        {definedTokensToIcon[this.props.symbol]}
                        <Control isExpanded={true} hasIcons={'left'}>
                            <Label style={{ paddingLeft: '5px', paddingTop: '5px' }} isSize={'small'}>
                                {this.props.description}
                            </Label>
                        </Control>
                    </Field>
                </DropdownItem>
            </div>
        );
    }
}

export { TokenSelectorItem, definedTokensToIcon };
