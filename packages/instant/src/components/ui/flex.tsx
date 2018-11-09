import { MediaChoice, stylesForMedia } from '../../style/media';
import { ColorOption, styled } from '../../style/theme';
import { cssRuleIfExists } from '../../style/util';

export interface FlexProps {
    direction?: 'row' | 'column';
    flexWrap?: 'wrap' | 'nowrap';
    justify?: 'flex-start' | 'center' | 'space-around' | 'space-between' | 'space-evenly' | 'flex-end';
    align?: 'flex-start' | 'center' | 'space-around' | 'space-between' | 'space-evenly' | 'flex-end';
    width?: MediaChoice;
    height?: MediaChoice;
    backgroundColor?: ColorOption;
    inline?: boolean;
    flexGrow?: number | string;
}

export const Flex =
    styled.div <
    FlexProps >
    `
    && {
        display: ${props => (props.inline ? 'inline-flex' : 'flex')};
        flex-direction: ${props => props.direction};
        flex-wrap: ${props => props.flexWrap};
        ${props => cssRuleIfExists(props, 'flexGrow')}
        justify-content: ${props => props.justify};
        align-items: ${props => props.align};
        background-color: ${props => (props.backgroundColor ? props.theme[props.backgroundColor] : 'none')};
        ${props => (props.width ? stylesForMedia('width', props.width) : '')}
        ${props => (props.height ? stylesForMedia('height', props.height) : '')}
    }
`;

Flex.defaultProps = {
    direction: 'row',
    flexWrap: 'nowrap',
    justify: 'center',
    align: 'center',
};

Flex.displayName = 'Flex';
