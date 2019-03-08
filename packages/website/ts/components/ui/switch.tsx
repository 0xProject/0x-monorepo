import * as React from 'react';
import styled from 'styled-components';

import { Heading } from 'ts/components/text';
import { colors } from 'ts/style/colors';

interface ToggleProps {
    className?: string;
    name?: string;
    value?: string;
    isChecked?: boolean;
    isDisabled?: boolean;
    onToggle?: (e: React.ChangeEvent) => void;
    width?: string;
    height?: string;
    borderWidth?: string;
    borderColor?: string;
    backgroundColor?: string;
    backgroundColorDisabled?: string;
    radius?: string;
    radiusBackground?: string;
    knobRadius?: string;
    knobWidth?: string;
    knobHeight?: string;
    knobGap?: string;
    knobColor?: string;
}

const ToggleContainer = styled.label``;

const DEFAULT_TOGGLE_STYLES = {
    WIDTH: '48px',
    HEIGHT: '24px',
    KNOB_WIDTH: '12px',
    KNOB_HEIGHT: '12px',
};

export const ToggleBase = styled.span<ToggleProps>`
    position: relative;
    box-sizing: border-box;
    display: inline-grid;
    align-items: center;
    width: ${p => p.width || DEFAULT_TOGGLE_STYLES.WIDTH};
    height: ${p => p.height || DEFAULT_TOGGLE_STYLES.HEIGHT};
    vertical-align: text-top;
    margin: 0 4px;
    input[type="checkbox"] {
        position: absolute;
        margin-left: -9999px;
        visibility: hidden;
        // off state
        & + label {
        display: inline-grid;
        box-sizing: border-box;
        align-items: center;
        outline: none;
        user-select: none;
        width: ${p => p.width || DEFAULT_TOGGLE_STYLES.WIDTH};
        height: ${p => p.height || DEFAULT_TOGGLE_STYLES.HEIGHT};
        background-color: ${p =>
            p.knobColor || '#EAEAEA'};
        border-radius: ${p => p.radius || '256px'};
        cursor: pointer;
        transition: background ease-out 0.3s;
        &:before {
            content: "";
            display: block;
            position: absolute;
            border-radius: ${p =>
            p.radiusBackground || '256px'};
            width: calc(
            ${p => p.width || DEFAULT_TOGGLE_STYLES.WIDTH} - 2 *
                ${p => p.borderWidth || '2px'}
            );
            height: calc(
            ${p => p.height || DEFAULT_TOGGLE_STYLES.HEIGHT} - 2 *
                ${p => p.borderWidth || '2px'}
            );
            background-color: ${p => p.backgroundColor || colors.white};
            left: ${p => p.borderWidth || '2px'};
        }
        &:after {
            display: block;
            position: absolute;
            content: "";
            width: ${p => p.knobWidth || DEFAULT_TOGGLE_STYLES.KNOB_WIDTH};
            height: ${p => p.knobHeight || DEFAULT_TOGGLE_STYLES.KNOB_HEIGHT};
            border-radius: ${p => p.knobRadius || '100%'};
            background-color: ${p =>
            p.knobColor || '#EAEAEA'};
            transition: all ease-out 0.4s;
            margin-left: ${p => p.knobGap || '4px'};
        }
        }
        // on state
        &:checked {
        & + label {
            background-color: ${p => p.borderColor || colors.brandLight};
            &:before {
                background-color: ${p => p.backgroundColor || colors.white};
            }
            &:after {
                margin-left: calc(
                    100% - ${p => p.knobWidth || DEFAULT_TOGGLE_STYLES.KNOB_WIDTH} -
                    ${p => p.knobGap || '4px'}
                );
            transition: all ease-out 0.2s;
            background-color: ${p =>
                p.knobColor || colors.brandLight};
            }
        }
        &:disabled {
            & + label {
                background-color: ${p => p.backgroundColorDisabled || '#eee'};
                &:after {
                    box-shadow: none;
                }
            }
        }
        }
        // disabled
        &:disabled {
        & + label {
            background-color: ${p => p.backgroundColorDisabled || '#eee'};
            cursor: default;
            &:after {
                box-shadow: none;
                background-color: ${p => p.backgroundColorDisabled || '#eee'};
            }
        }
        }
    }
`;

export const Toggle = React.forwardRef((props: ToggleProps, ref: React.Ref<HTMLInputElement>) => {
    const {
        className,
        name,
        isChecked = false,
        isDisabled = false,
        value = '',
        onToggle = () => true,
    } = props;

    return (
    <ToggleBase className={className} {...props}>
        <input
            ref={ref}
            onChange={onToggle}
            type={'checkbox'}
            defaultChecked={isChecked}
            id={name}
            name={name}
            value={value}
            disabled={isDisabled}
        />
        <ToggleContainer htmlFor={name} />
    </ToggleBase>
    );
});

const SwitchWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
`;

export interface SwitchProps {
    label: string;
    isChecked?: boolean;
    onToggle: (checked: boolean) => void;
}

export class Switch extends React.Component<SwitchProps> {
    public switchRef: React.RefObject<HTMLInputElement> = React.createRef();

    constructor(props: SwitchProps) {
        super(props);
    }

    public render(): React.ReactNode {
        const onToggle = () => { this.props.onToggle(this.switchRef.current.checked); };
        return <SwitchWrapper>
            <Heading isNoMargin={true} asElement="h3" size={'small'}>{this.props.label}</Heading>
            <Toggle ref={this.switchRef} isChecked={this.props.isChecked} onToggle={onToggle} knobGap={'6px'} name={this.props.label}/>
        </SwitchWrapper>;
    }
}
