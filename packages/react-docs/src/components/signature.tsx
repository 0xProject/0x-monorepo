import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { DocsInfo } from '../docs_info';
import { Parameter, Type as TypeDef, TypeDefinitionByName, TypeParameter } from '../types';
import { constants } from '../utils/constants';

import { Type } from './type';

export interface SignatureProps {
    name: string;
    returnType: TypeDef;
    parameters: Parameter[];
    sectionName: string;
    shouldHideMethodName?: boolean;
    shouldUseArrowSyntax?: boolean;
    typeDefinitionByName?: TypeDefinitionByName;
    typeParameter?: TypeParameter;
    callPath?: string;
    docsInfo: DocsInfo;
}

const defaultProps = {
    shouldHideMethodName: false,
    shouldUseArrowSyntax: false,
    callPath: '',
};

export const Signature: React.SFC<SignatureProps> = (props: SignatureProps) => {
    const sectionName = constants.TYPES_SECTION_NAME;
    const parameters = renderParameters(props.parameters, props.docsInfo, sectionName, props.typeDefinitionByName);
    const paramStringArray: any[] = [];
    // HACK: For now we don't put params on newlines if there are less then 2 of them.
    // Ideally we would check the character length of the resulting method signature and
    // if it exceeds the available space, put params on their own lines.
    const hasMoreThenTwoParams = parameters.length > 2;
    _.each(parameters, (param: React.ReactNode, i: number) => {
        const finalParam = hasMoreThenTwoParams ? (
            <span className="pl2" key={`param-${i}`}>
                {param}
            </span>
        ) : (
            param
        );
        paramStringArray.push(finalParam);
        const comma = hasMoreThenTwoParams ? (
            <span key={`param-comma-${i}`}>
                , <br />
            </span>
        ) : (
            ', '
        );
        paramStringArray.push(comma);
    });
    if (!hasMoreThenTwoParams) {
        paramStringArray.pop();
    }
    const methodName = props.shouldHideMethodName ? '' : props.name;
    const typeParameterIfExists = _.isUndefined(props.typeParameter)
        ? undefined
        : renderTypeParameter(props.typeParameter, props.docsInfo, sectionName, props.typeDefinitionByName);
    return (
        <span style={{ fontSize: 15 }}>
            {props.callPath}
            {methodName}
            {typeParameterIfExists}({hasMoreThenTwoParams && <br />}
            {paramStringArray})
            {props.returnType && (
                <span>
                    {props.shouldUseArrowSyntax ? ' => ' : ': '}{' '}
                    <Type
                        type={props.returnType}
                        sectionName={sectionName}
                        typeDefinitionByName={props.typeDefinitionByName}
                        docsInfo={props.docsInfo}
                    />
                </span>
            )}
        </span>
    );
};

Signature.defaultProps = defaultProps;

function renderParameters(
    parameters: Parameter[],
    docsInfo: DocsInfo,
    sectionName: string,
    typeDefinitionByName?: TypeDefinitionByName,
): React.ReactNode[] {
    const params = _.map(parameters, (p: Parameter) => {
        const isOptional = p.isOptional;
        const hasDefaultValue = !_.isUndefined(p.defaultValue);
        const type = (
            <Type
                type={p.type}
                sectionName={sectionName}
                typeDefinitionByName={typeDefinitionByName}
                docsInfo={docsInfo}
            />
        );
        return (
            <span key={`param-${p.type}-${p.name}`}>
                {p.name}
                {isOptional && '?'}: {type}
                {hasDefaultValue && ` = ${p.defaultValue}`}
            </span>
        );
    });
    return params;
}

function renderTypeParameter(
    typeParameter: TypeParameter,
    docsInfo: DocsInfo,
    sectionName: string,
    typeDefinitionByName?: TypeDefinitionByName,
): React.ReactNode {
    const typeParam = (
        <span>
            {`<${typeParameter.name} extends `}
            <Type
                type={typeParameter.type}
                sectionName={sectionName}
                typeDefinitionByName={typeDefinitionByName}
                docsInfo={docsInfo}
            />
            {`>`}
        </span>
    );
    return typeParam;
}
