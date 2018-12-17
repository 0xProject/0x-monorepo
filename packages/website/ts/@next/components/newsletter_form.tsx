import * as React from 'react';
import styled, { withTheme } from 'styled-components';

import { colors } from 'ts/style/colors';

import { ThemeValuesInterface } from 'ts/@next/components/siteWrap';

interface FormProps {
    theme: ThemeValuesInterface;
}

interface InputProps {
    isSubmitted: boolean;
    name: string;
    type: string;
    label: string;
    textColor: string;
}

interface ArrowProps {
    isSubmitted: boolean;
}

const Input = React.forwardRef((props: InputProps, ref: React.Ref<HTMLInputElement>) => {
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

class Form extends React.Component<FormProps> {
    public emailInput = React.createRef<HTMLInputElement>();
    public state = {
        isSubmitted: false,
    };
    public render(): React.ReactNode {
        const { isSubmitted } = this.state;
        const { theme } = this.props;

        return (
            <StyledForm onSubmit={this._onSubmitAsync.bind(this)}>
                <InputWrapper>
                    <Input
                        isSubmitted={isSubmitted}
                        name="email"
                        type="email"
                        label="Email Address"
                        ref={this.emailInput}
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
    }

    private async _onSubmitAsync(e: Event): Promise<void> {
        e.preventDefault();

        const email = this.emailInput.current.value;
        const referrer = 'https://0x.org/';

        this.setState({ isSubmitted: true });

        try {
            const response = await fetch('https://website-api.0x.org/newsletter_subscriber/substack', {
                method: 'post',
                mode: 'cors',
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({ email, referrer }),
            });
        } catch (e) {
            // dosomething
        }
    }
}

export const NewsletterForm = withTheme(Form);

const StyledForm = styled.form`
    appearance: none;
    border: 0;
    color: ${colors.white};
    padding: 13px 0 14px;
    margin-top: 27px;
`;

const StyledInput =
    styled.input <
    InputProps >
    `
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
        color: #B1B1B1; // #9D9D9D on light theme
    }
`;

const InputWrapper = styled.div`
    position: relative;
`;

const InnerInputWrapper =
    styled.div <
    ArrowProps >
    `
    opacity: ${props => props.isSubmitted && 0};
    visibility: ${props => props.isSubmitted && 'hidden'};
    transition: opacity 0.25s ease-in-out, visibility 0.25s ease-in-out;
    transition-delay: 0.30s;
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

    &:focus-within {
        //background-color: #eee;
    }
`;

const Text = styled.p`
    color: #656565;
    font-size: 0.833333333rem;
    font-weight: 300;
    line-height: 1.2em;
    margin-top: 15px;
`;

const SuccessText =
    styled.p <
    ArrowProps >
    `
    color: #B1B1B1;
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

const Arrow =
    styled.svg <
    ArrowProps >
    `
    transform: ${props => props.isSubmitted && `translateX(44px)`};
    transition: transform 0.25s ease-in-out;
`;
