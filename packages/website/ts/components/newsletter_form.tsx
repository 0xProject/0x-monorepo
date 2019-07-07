import React, { useState } from 'react';
import styled, { withTheme } from 'styled-components';

import { ThemeValuesInterface } from 'ts/components/siteWrap';
import { colors } from 'ts/style/colors';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

interface IFormProps {
    theme: ThemeValuesInterface;
}

interface IInputProps {
    isSubmitted: boolean;
    name: string;
    type: string;
    label: string;
    textColor: string;
    required?: boolean;
}

interface IArrowProps {
    isSubmitted: boolean;
}

const Input = React.forwardRef((props: IInputProps, ref: React.Ref<HTMLInputElement>) => {
    const { name, label, type } = props;
    const id = `input-${name}`;

    return (
        <InnerInputWrapper {...props}>
            <label className="visuallyHidden" htmlFor={id}>
                {label}
            </label>
            <StyledInput ref={ref} id={id} placeholder={label} type={type || 'text'} {...props} />
        </InnerInputWrapper>
    );
});

const Form: React.FC<IFormProps> = ({ theme }) => {
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const emailInput = React.createRef<HTMLInputElement>();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const email = emailInput.current.value;
        const referrer = 'https://0x.org/';

        setIsSubmitted(true);

        if (email === 'triggererror@0xproject.org') {
            throw new Error('Manually triggered error');
        }

        try {
            await fetch(`${utils.getBackendBaseUrl()}/newsletter_subscriber/substack`, {
                method: 'post',
                mode: 'cors',
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({ email, referrer }),
            });
        } catch (e) {
            errorReporter.report(e);
        }
    };

    return (
        <StyledForm onSubmit={handleSubmit}>
            <InputWrapper>
                <Input
                    isSubmitted={isSubmitted}
                    name="email"
                    type="email"
                    label="Email Address"
                    ref={emailInput}
                    required={true}
                    textColor={theme.textColor}
                />

                <SubmitButton>
                    <Arrow
                        isSubmitted={isSubmitted}
                        width="22"
                        height="17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M13.066 0l-1.068 1.147 6.232 6.557H0v1.592h18.23l-6.232 6.557L13.066 17l8.08-8.5-8.08-8.5z"
                            fill="#CBCBCB"
                        />
                    </Arrow>
                </SubmitButton>
                <SuccessText isSubmitted={isSubmitted}>🎉 Thank you for signing up!</SuccessText>
            </InputWrapper>
            <Text>Subscribe to our newsletter for updates in the 0x ecosystem</Text>
        </StyledForm>
    );
};

export const NewsletterForm = withTheme(Form);

const StyledForm = styled.form`
    appearance: none;
    border: 0;
    color: ${colors.white};
    padding: 13px 0 14px;
    margin-top: 27px;
`;

const StyledInput = styled.input<IInputProps>`
    appearance: none;
    background-color: transparent;
    border: 0;
    border-bottom: 1px solid #393939;
    color: ${props => props.textColor || '#fff'};
    font-size: 1.294117647rem;
    padding: 15px 0;
    outline: none;
    width: 100%;

    &::placeholder {
        color: #b1b1b1; // #9D9D9D on light theme
    }
`;

const InputWrapper = styled.div`
    position: relative;
`;

const InnerInputWrapper = styled.div<IArrowProps>`
    opacity: ${props => props.isSubmitted && 0};
    visibility: ${props => props.isSubmitted && 'hidden'};
    transition: opacity 0.25s ease-in-out, visibility 0.25s ease-in-out;
    transition-delay: 0.3s;
`;

const SubmitButton = styled.button`
    width: 44px;
    height: 44px;
    background-color: transparent;
    border: 0;
    position: absolute;
    right: 0;
    top: calc(50% - 22px);
    overflow: hidden;
    outline: 0;
`;

const Text = styled.p`
    color: #656565;
    font-size: 0.833333333rem;
    font-weight: 300;
    line-height: 1.2em;
    margin-top: 15px;
`;

const SuccessText = styled.p<IArrowProps>`
    color: #b1b1b1;
    font-size: 1rem;
    font-weight: 300;
    line-height: 1.2em;
    padding-top: 25px;
    position: absolute;
    left: 0;
    top: 0;
    text-align: left;
    right: 50px;
    opacity: ${props => (props.isSubmitted ? 1 : 0)};
    visibility: ${props => (props.isSubmitted ? 'visible' : 'hidden')};
    transition: opacity 0.25s ease-in-out, visibility 0.25s ease-in-out;
    transition-delay: 0.55s;
`;

const Arrow = styled.svg<IArrowProps>`
    transform: ${props => props.isSubmitted && `translateX(44px)`};
    transition: transform 0.25s ease-in-out;
`;
