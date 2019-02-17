import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

interface ErrorModalProps {
    heading?: string;
    text?: string;
    isOpen: boolean;
    buttonText?: string;
    onClose?: () => void;
}
export const ErrorModal: React.StatelessComponent<ErrorModalProps> = ({
    heading,
    text,
    buttonText,
    isOpen,
    onClose,
}) => {
    return (
        <Wrapper isOpen={isOpen}>
            <Inner>
                <Icon color="#FD0000" name="help" size={100} margin={[0, 0, 'default', 0]} />
                <Heading color={colors.textDarkPrimary} asElement="h3" size={34}>
                    {heading}
                </Heading>
                <ErrorBox>
                    <Text>{text}</Text>
                </ErrorBox>
                <ButtonCta type="button" onClick={onClose}>
                    {buttonText}
                </ButtonCta>
            </Inner>
        </Wrapper>
    );
};

ErrorModal.defaultProps = {
    heading: 'Error',
    buttonText: 'Try Again',
    isOpen: false,
};

const Wrapper = styled.div<ErrorModalProps>`
    position: absolute;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    visibility: hidden;

    ${props =>
        props.isOpen &&
        `
        opacity: 1;
        visibility: visible;
    `}
`;

const Inner = styled.div`
    margin: auto;
    background-color: #f6f6f6;
    padding: 30px 30px;
    width: 440px;
    height: 440px;
    text-align: center;
`;

const ErrorBox = styled.div`
    background-color: #fdeded;
    border: 1px solid #fd0000;
    padding: 18px 30px;
    margin-bottom: 30px;
    overflow: auto;
    max-height: 95px;
`;

const Text = styled(Paragraph).attrs({
    isMuted: false,
    color: colors.textDarkSecondary,
})`
    text-align: center;
    margin-bottom: 0;
`;

const ButtonCta = styled(Button).attrs({
    borderColor: '#7A7A7A',
    isTransparent: true,
    color: colors.textDarkSecondary,
})`
    margin-bottom: 0;
    width: 100%;
`;
