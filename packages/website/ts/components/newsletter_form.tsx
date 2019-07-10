import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

interface IFormProps {
    color?: string;
}

interface IInputProps {
    isSubmitted: boolean;
    name: string;
    type: string;
    label: string;
    color?: string;
    required?: boolean;
}

interface IArrowProps {
    isSubmitted: boolean;
}

export const NewsletterForm: React.FC<IFormProps> = ({ color }) => {
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
            {isSubmitted ? (
                <SuccessText isSubmitted={isSubmitted}>🎉 Thank you for signing up!</SuccessText>
            ) : (
                <Input
                    color={color}
                    isSubmitted={isSubmitted}
                    name="email"
                    type="email"
                    label="Email Address"
                    ref={emailInput}
                    required={true}
                />
            )}

            <SubmitButton>
                <Arrow
                    color={color}
                    isSubmitted={isSubmitted}
                    width="22"
                    height="17"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M13.066 0l-1.068 1.147 6.232 6.557H0v1.592h18.23l-6.232 6.557L13.066 17l8.08-8.5-8.08-8.5z" />
                </Arrow>
            </SubmitButton>
        </StyledForm>
    );
};

const Input = React.forwardRef((props: IInputProps, ref: React.Ref<HTMLInputElement>) => {
    const { name, label, type } = props;
    const id = `input-${name}`;

    return (
        <>
            <label className="visuallyHidden" htmlFor={id}>
                {label}
            </label>
            <StyledInput ref={ref} id={id} placeholder={label} type={type || 'text'} {...props} />
        </>
    );
});

const INPUT_HEIGHT = '60px';

const StyledForm = styled.form`
    position: relative;
    margin-top: 24px;
`;

const StyledInput = styled.input<IInputProps>`
    appearance: none;
    background-color: transparent;
    border: 0;
    border-bottom: 1px solid ${({ color }) => color || '#393939'};
    color: ${({ theme }) => theme.textColor};
    height: ${INPUT_HEIGHT};
    font-size: 1.3rem;
    outline: none;
    width: 100%;

    &::placeholder {
        color: #b1b1b1;
    }
`;

const SubmitButton = styled.button`
    width: 44px;
    height: ${INPUT_HEIGHT};
    background-color: transparent;
    border: 0;
    position: absolute;
    right: 0;
    top: 0;
    overflow: hidden;
    outline: 0;
`;

// prettier-ignore
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const SuccessText = styled.p<IArrowProps>`
    color: #b1b1b1;
    font-size: 1rem;
    font-weight: 300;
    line-height: ${INPUT_HEIGHT};
    animation: ${fadeIn} 0.5s ease-in-out;
`;

const Arrow = styled.svg<IArrowProps>`
    fill: ${({ color }) => color};
    transform: ${({ isSubmitted }) => isSubmitted && `translateX(44px)`};
    transition: transform 0.25s ease-in-out;
`;
