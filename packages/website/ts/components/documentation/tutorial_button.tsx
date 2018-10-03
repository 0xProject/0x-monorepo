import { colors, Link } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Text } from 'ts/components/ui/text';
import { Deco, Key, TutorialInfo } from 'ts/types';
import { Translate } from 'ts/utils/translate';

export interface TutorialButtonProps {
    translate: Translate;
    tutorialInfo: TutorialInfo;
}

export interface TutorialButtonState {
    isHovering: boolean;
}

export class TutorialButton extends React.Component<TutorialButtonProps, TutorialButtonState> {
    constructor(props: TutorialButtonProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public render(): React.ReactNode {
        return (
            <Link
                to={this.props.tutorialInfo.link.to}
                shouldOpenInNewTab={this.props.tutorialInfo.link.shouldOpenInNewTab}
                onMouseEnter={this._onHover.bind(this)}
                onMouseOver={this._onHover.bind(this)}
                onMouseLeave={this._onHoverOff.bind(this)}
            >
                <div
                    className="flex relative"
                    style={{
                        borderRadius: 4,
                        border: `1px solid ${this.state.isHovering ? colors.lightLinkBlue : colors.grey325}`,
                        padding: 20,
                        marginBottom: 15,
                        backgroundColor: this.state.isHovering ? colors.lightestBlue : colors.white,
                    }}
                >
                    <div className="col col-1 flex items-center sm-pr3">
                        <img src={this.props.tutorialInfo.iconUrl} height={40} />
                    </div>
                    <div className="lg-pl2 md-pl2 sm-pl3 col col-10">
                        <Text Tag="div" fontSize="18" fontColor={colors.lightLinkBlue} fontWeight="bold">
                            {this.props.translate.get(this.props.tutorialInfo.link.title as Key, Deco.Cap)}
                        </Text>
                        <Text Tag="div" fontColor={colors.grey750} fontSize="16">
                            {this.props.translate.get(this.props.tutorialInfo.description as Key, Deco.Cap)}
                        </Text>
                    </div>
                    <div className="col col-1 flex items-center justify-end">
                        <div className="right">
                            <i
                                className="zmdi zmdi-chevron-right bold"
                                style={{ fontSize: 26, color: colors.lightLinkBlue }}
                            />
                        </div>
                    </div>
                </div>
            </Link>
        );
    }
    private _onHover(_event: React.FormEvent<HTMLInputElement>): void {
        if (this.state.isHovering) {
            return;
        }
        this.setState({
            isHovering: true,
        });
    }
    private _onHoverOff(): void {
        this.setState({
            isHovering: false,
        });
    }
}
