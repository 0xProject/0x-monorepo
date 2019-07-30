import * as _ from 'lodash';
import * as React from 'react';

import { Parameter, Type as TypeDef, TypeDefinitionByName, TypeParameter } from '@0x/types';

import { DocsInfo } from 'ts/utils/docs_info';

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
    isInPopover: boolean;
    isFallback?: boolean;
}

const defaultProps = {
    shouldHideMethodName: false,
    shouldUseArrowSyntax: false,
    callPath: '',
    isFallback: false,
};

export const Signature: React.SFC<SignatureProps> = (props: SignatureProps) => {
    const sectionName = props.sectionName;
    const parameters = renderParameters(
        props.parameters,
        props.docsInfo,
        sectionName,
        props.isInPopover,
        props.name,
        props.typeDefinitionByName,
    );
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
    const typeParameterIfExists =
        props.typeParameter === undefined
            ? undefined
            : renderTypeParameter(
                  props.typeParameter,
                  props.docsInfo,
                  sectionName,
                  props.isInPopover,
                  props.typeDefinitionByName,
              );
    return (
        <span style={{ fontSize: 15 }}>
            {props.callPath}
            {props.isFallback ? '' : methodName}
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
                        isInPopover={props.isInPopover}
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
    isInPopover: boolean,
    name: string,
    typeDefinitionByName?: TypeDefinitionByName,
): React.ReactNode[] {
    const params = _.map(parameters, (p: Parameter, i: number) => {
        const isOptional = p.isOptional;
        const hasDefaultValue = p.defaultValue !== undefined;
        const type = (
            <Type
                type={p.type}
                sectionName={sectionName}
                typeDefinitionByName={typeDefinitionByName}
                docsInfo={docsInfo}
                isInPopover={isInPopover}
            />
        );
        return (
            <span key={`param-${JSON.stringify(p.type)}-${name}-${i}`}>
                {!_.isEmpty(p.name) && (
                    <span>
                        {p.name}
                        {isOptional && '?'}:{' '}
                    </span>
                )}
                {type}
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
    isInPopover: boolean,
    typeDefinitionByName?: TypeDefinitionByName,
): React.ReactNode {
    const typeParam = (
        <span>
            {`<${typeParameter.name}`}
            {typeParameter.type !== undefined && (
                <span>
                    {' extends '}
                    <Type
                        type={typeParameter.type}
                        sectionName={sectionName}
                        typeDefinitionByName={typeDefinitionByName}
                        docsInfo={docsInfo}
                        isInPopover={isInPopover}
                    />
                </span>
            )}
            {`>`}
        </span>
    );
    return typeParam;
}
