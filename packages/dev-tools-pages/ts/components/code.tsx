import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/variables';

import { Button as BaseButton } from './button';

const isTouch = Boolean(
    'ontouchstart' in window ||
        (window as any).navigator.maxTouchPoints > 0 ||
        (window as any).navigator.msMaxTouchPoints > 0,
);

interface CodeProps {
    language?: string;
    isLight?: boolean;
    isDiff?: boolean;
    gutter?: Array<number | undefined>;
    gutterLength?: number;
    canCopy?: boolean;
    isEtc?: boolean;
}

interface CodeState {
    hlCode?: string;
    didCopy?: boolean;
}

const Button = styled(BaseButton)`
    opacity: ${isTouch ? '1' : '0'};
    position: absolute;
    top: 1rem;
    right: 1rem;
    transition: opacity 0.2s;
    :focus {
        opacity: 1;
    }
`;

const Container = styled.div`
    position: relative;
    &:hover ${Button} {
        opacity: 1;
    }
`;

const Base = styled.div<CodeProps>`
    font-size: 0.875rem;
    color: ${props => (_.isUndefined(props.language) ? colors.white : 'inherit')};
    background-color: ${props =>
        props.isLight ? 'rgba(255,255,255,.15)' : _.isUndefined(props.language) ? colors.black : '#F1F4F5'};
    white-space: ${props => (_.isUndefined(props.language) ? 'nowrap' : '')};
    position: relative;

    ${props =>
        props.isDiff
            ? `
        background-color: #E9ECED;
        display: flex;
        padding-top: 1.5rem;
        padding-bottom: 1.5rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    `
            : ``}
`;

const CodeDiff: React.StatelessComponent<any> = ({ gutterLength, ...props }) => <code {...props} />;
const StyledCodeDiff = styled(CodeDiff)`
    ::before {
        content: '';
        width: calc(0.75rem + ${props => props.gutterLength}ch);
        background-color: #e2e5e6;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
    }

    [class^='line-'] {
        display: inline-block;
        width: 100%;
        position: relative;
        padding-right: 1.5rem;
        padding-left: calc(2.25rem + ${props => props.gutterLength}ch);

        ::before {
            content: attr(data-gutter);

            width: ${props => props.gutterLength};
            padding-left: 0.375rem;
            padding-right: 0.375rem;
            position: absolute;
            top: 50%;
            left: 0;
            transform: translateY(-50%);
            z-index: 1;
        }
    }

    .line-addition {
        background-color: rgba(0, 202, 105, 0.1);
    }
    .line-deletion {
        background-color: rgba(255, 0, 0, 0.07);
    }
`;

const StyledPre = styled.pre<CodeProps>`
    margin: 0;
    ${props =>
        !props.isDiff
            ? `
        padding: 1.5rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    `
            : ``};
`;

const StyledCopyInput = styled.textarea`
    opacity: 0;
    height: 0;
    position: absolute;
    top: 0;
    right: 0;
    z-index: -1;
`;

class Code extends React.Component<CodeProps, CodeState> {
    public state: CodeState = {};
    private readonly _code = React.createRef<HTMLTextAreaElement>();
    public componentDidMount(): void {
        // _onMountAsync is only setting state, so no point in handling the promise
        // tslint:disable-next-line:no-floating-promises
        this._onMountAsync();
    }
    public render(): React.ReactNode {
        const { language, isLight, isDiff, children, gutterLength, canCopy } = this.props;
        const { hlCode } = this.state;

        return (
            <Container>
                <Base language={language} isDiff={isDiff} isLight={isLight}>
                    <StyledPre isDiff={isDiff}>
                        {_.isUndefined(hlCode) ? (
                            <code>{children}</code>
                        ) : (
                            <StyledCodeDiff
                                gutterLength={gutterLength}
                                dangerouslySetInnerHTML={hlCode ? { __html: this.state.hlCode } : null}
                            />
                        )}
                    </StyledPre>
                    {!('clipboard' in navigator) ? (
                        <StyledCopyInput readOnly={true} aria-hidden="true" ref={this._code} value={children} />
                    ) : null}
                </Base>
                {navigator.userAgent !== 'ReactSnap' && canCopy ? (
                    <Button onClick={this._handleCopyAsync.bind(this)}>{this.state.didCopy ? 'Copied' : 'Copy'}</Button>
                ) : null}
            </Container>
        );
    }
    private async _onMountAsync(): Promise<void> {
        const { language, children, isDiff, gutter, isEtc } = this.props;

        const code = children as string;

        if (language !== undefined) {
            const { highlight } = await System.import(/* webpackChunkName: 'highlightjs' */ 'ts/highlight');

            this.setState({
                hlCode: highlight({ language, code, isDiff, gutter, isEtc }),
            });
        }
    }
    private async _handleCopyAsync(): Promise<void> {
        try {
            if ('clipboard' in navigator) {
                await (navigator as any).clipboard.writeText(this.props.children);
                this.setState({ didCopy: true });
            } else {
                const lastActive = document.activeElement as HTMLElement;
                this._code.current.focus();
                this._code.current.select();
                document.execCommand('copy');
                lastActive.focus();
                this.setState({ didCopy: true });
            }
        } catch (error) {
            this.setState({ didCopy: false });
        }
    }
}

export { Code };
