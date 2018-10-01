import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
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
                to={this.props.tutorialInfo.location}
                className="text-decoration-none"
                onMouseEnter={this._onHover.bind(this)}
                onMouseLeave={this._onHoverOff.bind(this)}
            >
                <div
                    className="flex relative"
                    style={{
                        borderRadius: 4,
                        border: `1px solid ${this.state.isHovering ? colors.lightLinkBlue : '#dfdfdf'}`,
                        padding: 20,
                        marginBottom: 15,
                        backgroundColor: this.state.isHovering ? '#e7f1fd' : colors.white,
                    }}
                >
                    <div className="col col-1 flex items-center sm-pr3">
                        <img src={this.props.tutorialInfo.iconUrl} height={40} />
                    </div>
                    <div className="pl2 col col-10">
                        <Text Tag="div" fontSize="18" fontColor={colors.lightLinkBlue} fontWeight="bold">
                            {this.props.translate.get(this.props.tutorialInfo.title as Key, Deco.Cap)}
                        </Text>
                        <Text Tag="div" fontColor="#555555" fontSize="16">
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
