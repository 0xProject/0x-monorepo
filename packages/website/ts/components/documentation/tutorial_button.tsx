import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { TutorialInfo } from 'ts/types';

export interface TutorialButtonProps {
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
                style={{ textDecoration: 'none' }}
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
                    <div>
                        <img src={this.props.tutorialInfo.iconUrl} height={40} />
                    </div>
                    <div className="pl2">
                        <Text Tag="div" fontSize="18" fontColor={colors.lightLinkBlue} fontWeight="bold">
                            {this.props.tutorialInfo.title}
                        </Text>
                        <Text Tag="div" fontColor="#555555" fontSize="16">
                            {this.props.tutorialInfo.description}
                        </Text>
                    </div>
                    <div className="absolute" style={{ top: 31, right: 31 }}>
                        <i
                            className="zmdi zmdi-chevron-right bold"
                            style={{ fontSize: 26, color: colors.lightLinkBlue }}
                        />
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
