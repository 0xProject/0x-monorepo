import * as React from 'react';
import styled from 'styled-components';

import { colors, media } from 'ts/variables';
import BaseButton from './Button';

const touch = Boolean(
    'ontouchstart' in window ||
        (window as any).navigator.maxTouchPoints > 0 ||
        (window as any).navigator.msMaxTouchPoints > 0,
);

interface CodeProps {
    children: React.ReactNode;
    language?: string;
    light?: boolean;
    diff?: boolean;
    gutter?: Array<number>;
    gutterLength?: number;
    copy?: boolean;
    etc?: boolean;
}

interface CodeState {
    hlCode?: string;
    copied?: boolean;
}

const Button = styled(BaseButton)`
    opacity: ${touch ? '1' : '0'};
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

const Base =
    styled.div <
    CodeProps >
    `
    font-size: .875rem;
    color: ${props => (props.language === undefined ? colors.white : 'inherit')};
    background-color: ${props =>
        props.light ? 'rgba(255,255,255,.15)' : props.language === undefined ? colors.black : '#F1F4F5'};
    white-space: ${props => (props.language === undefined ? 'nowrap' : '')};
    position: relative;

    ${props =>
        props.diff
            ? `
        background-color: #E9ECED;
        display: flex;
        padding-top: 1.5rem;
        padding-bottom: 1.5rem;
    `
            : `
        padding: 1.5rem;
    `}

    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
`;

const StyledCodeDiff = styled(({ gutterLength, children, ...props }: any) => <code {...props}>{children}</code>)`
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

const StyledPre = styled.pre`
    margin: 0;
`;

const StyledCopyInput = styled.textarea`
    opacity: 0;
    height: 0;
    position: absolute;
    top: 0;
    right: 0;
    z-index: -1;
`;

const CopyInput = StyledCopyInput as any;

class Code extends React.Component<CodeProps, CodeState> {
    code = React.createRef<HTMLTextAreaElement>();

    state: CodeState = {};

    constructor(props: CodeProps) {
        super(props);
    }

    async componentDidMount() {
        const { language, children, diff, gutter, etc } = this.props;

        const code = children as string;

        if (language !== undefined) {
            /* console.log(code); */
            const { default: highlight } = await System.import(/* webpackChunkName: 'highlightjs' */ 'ts/highlight');

            this.setState({
                hlCode: highlight({ language, code, diff, gutter, etc }),
            });
        }
    }

    handleCopy = async () => {
        try {
            if ('clipboard' in navigator) {
                await (navigator as any).clipboard.writeText(this.props.children);
                this.setState({ copied: true });
            } else {
                const lastActive = document.activeElement as HTMLElement;
                this.code.current.focus();
                this.code.current.select();
                document.execCommand('copy');
                lastActive.focus();
                this.setState({ copied: true });
            }
        } catch (error) {
            this.setState({ copied: false });
        }
    };

    render() {
        const { language, light, diff, children, gutterLength, copy } = this.props;
        const { hlCode } = this.state;

        let Code = 'code';
        let codeProps = {};
        if (diff) {
            codeProps = { gutterLength };
            Code = StyledCodeDiff as any;
        }

        /* console.log(hlCode); */

        return (
            <Container>
                <Base language={language} diff={diff} light={light}>
                    <StyledPre>
                        <Code {...codeProps} dangerouslySetInnerHTML={hlCode ? { __html: this.state.hlCode } : null}>
                            {hlCode === undefined ? children : null}
                        </Code>
                    </StyledPre>
                    {!('clipboard' in navigator) ? (
                        <CopyInput readOnly aria-hidden="true" ref={this.code} value={children} />
                    ) : null}
                </Base>
                {navigator.userAgent !== 'ReactSnap' && copy ? (
                    <Button onClick={this.handleCopy}>{this.state.copied ? 'Copied' : 'Copy'}</Button>
                ) : null}
            </Container>
        );
    }
}

export default Code;
