import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Button } from 'ts/components/button';
import { Input } from 'ts/components/modals/input';
import { Paragraph } from 'ts/components/text';

interface InputProps {
    path: string;
    onChangePath?: (selectedPath: string) => void;
}

interface InputState {
    derivationErrMsg?: string;
    derivationPath?: string;
}

const VALID_ETHEREUM_DERIVATION_PATH_PREFIX = `44'/60'`;

export class DerivationPathInput extends React.Component<InputProps, InputState> {
    public static defaultProps = {
        path: '',
    };
    public pathRef: React.RefObject<HTMLInputElement> = React.createRef();
    constructor(props: InputProps) {
        super(props);

        this.state = {
            derivationErrMsg: '',
            derivationPath: '',
        };
    }
    public render(): React.ReactNode {
        const { path } = this.props;
        const { derivationErrMsg, derivationPath } = this.state;
        const isPathChanged = derivationErrMsg === '' && derivationPath !== path;

        return (
            <Wrapper>
                <StyledInput name="derivationPath" label="Derivation Path" type="text" defaultValue={path} ref={this.pathRef} onChange={this._onDerivationPathChanged.bind(this)} />
                <ButtonUpdate onClick={this._updatePath.bind(this)} isDisabled={!isPathChanged}>Update</ButtonUpdate>
                {derivationErrMsg !== '' && (
                    <ErrorParagraph>
                        {derivationErrMsg}
                    </ErrorParagraph>
                )}
            </Wrapper>
        );
    }
    private _updatePath(): void {
        if (this.props.onChangePath) {
            this.props.onChangePath(this.pathRef.current.value);
        }
    }
    private _onDerivationPathChanged(_event: any): void {
        const derivationPath = _event.target.value;
        let derivationErrMsg = '';
        if (!_.startsWith(derivationPath, VALID_ETHEREUM_DERIVATION_PATH_PREFIX)) {
            derivationErrMsg = 'Must be valid Ethereum path.';
        }

        this.setState({
            derivationPath,
            derivationErrMsg,
        });
    }
}

const Wrapper = styled.div<{ marginBottom?: string }>`
    display: flex;
    align-items: flex-end;
    margin-bottom: 30px;
    text-align: left;
    flex-wrap: wrap;
`;

const ButtonUpdate = styled(Button).attrs({
    isTransparent: true,
    type: 'button',
    color: '#5C5C5C',
    borderColor: '#5C5C5C',
})`
    margin-left: 30px;

    ${props => props.isDisabled && `
        opacity: 0.5;
        border-color: #ccc;
    `}
`;

const ErrorParagraph = styled(Paragraph).attrs({
    color: colors.red,
    isMuted: true,
})`
    margin: 30px 0 0 30px;
    align-self: center;
`;

const StyledInput = styled(Input)`
    text-align: left;
    max-width: 150px;
    flex-grow: 0;
    max-width: 150px;

    label {
        color: ${colors.textDarkSecondary};
        font-size: 1rem;
        margin-bottom: 2px;
    }

    input {
        max-width: 150px;
    }
`;
