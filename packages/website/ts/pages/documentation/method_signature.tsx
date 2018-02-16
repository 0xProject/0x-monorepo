import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DocsInfo } from 'ts/pages/documentation/docs_info';
import { Type } from 'ts/pages/documentation/type';
import { Parameter, SolidityMethod, TypeDefinitionByName, TypescriptMethod } from 'ts/types';
import { constants } from 'ts/utils/constants';

interface MethodSignatureProps {
    method: TypescriptMethod | SolidityMethod;
    sectionName: string;
    shouldHideMethodName?: boolean;
    shouldUseArrowSyntax?: boolean;
    typeDefinitionByName?: TypeDefinitionByName;
    docsInfo: DocsInfo;
}

const defaultProps = {
    shouldHideMethodName: false,
    shouldUseArrowSyntax: false,
};

export const MethodSignature: React.SFC<MethodSignatureProps> = (props: MethodSignatureProps) => {
    const sectionName = constants.TYPES_SECTION_NAME;
    const parameters = renderParameters(props.method, props.docsInfo, sectionName, props.typeDefinitionByName);
    const paramStringArray: any[] = [];
    _.each(parameters, (param: React.ReactNode, i: number) => {
        const finalParam =
            parameters.length > 2 ? (
                <span className="pl2" key={`param-${i}`}>
                    {param}
                </span>
            ) : (
                param
            );
        paramStringArray.push(finalParam);
        const comma =
            parameters.length > 2 ? (
                <span key={`param-comma-${i}`}>
                    , <br />
                </span>
            ) : (
                ', '
            );
        paramStringArray.push(comma);
    });
    if (parameters.length <= 2) {
        paramStringArray.pop();
    }
    const methodName = props.shouldHideMethodName ? '' : props.method.name;
    const typeParameterIfExists = _.isUndefined((props.method as TypescriptMethod).typeParameter)
        ? undefined
        : renderTypeParameter(props.method, props.docsInfo, sectionName, props.typeDefinitionByName);
    return (
        <span style={{ fontSize: 15 }}>
            {props.method.callPath}
            {methodName}
            {typeParameterIfExists}({parameters.length > 2 && <br />}
            {paramStringArray})
            {props.method.returnType && (
                <span>
                    {props.shouldUseArrowSyntax ? ' => ' : ': '}{' '}
                    <Type
                        type={props.method.returnType}
                        sectionName={sectionName}
                        typeDefinitionByName={props.typeDefinitionByName}
                        docsInfo={props.docsInfo}
                    />
                </span>
            )}
        </span>
    );
};

MethodSignature.defaultProps = defaultProps;

function renderParameters(
    method: TypescriptMethod | SolidityMethod,
    docsInfo: DocsInfo,
    sectionName: string,
    typeDefinitionByName?: TypeDefinitionByName,
) {
    const parameters = method.parameters;
    const params = _.map(parameters, (p: Parameter) => {
        const isOptional = p.isOptional;
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
            </span>
        );
    });
    return params;
}

function renderTypeParameter(
    method: TypescriptMethod,
    docsInfo: DocsInfo,
    sectionName: string,
    typeDefinitionByName?: TypeDefinitionByName,
) {
    const typeParameter = method.typeParameter;
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
