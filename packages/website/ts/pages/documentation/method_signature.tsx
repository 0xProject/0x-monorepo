import * as _ from 'lodash';
import * as React from 'react';
import {DocsInfo} from 'ts/pages/documentation/docs_info';
import {Type} from 'ts/pages/documentation/type';
import {Parameter, SolidityMethod, TypeDefinitionByName, TypescriptMethod} from 'ts/types';
import {constants} from 'ts/utils/constants';

interface MethodSignatureProps {
    method: TypescriptMethod|SolidityMethod;
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
    const parameters = renderParameters(
        props.method, props.docsInfo, sectionName, props.typeDefinitionByName,
    );
    const paramString = _.reduce(parameters, (prev: React.ReactNode, curr: React.ReactNode) => {
        return [prev, ', ', curr];
    });
    const methodName = props.shouldHideMethodName ? '' : props.method.name;
    const typeParameterIfExists = _.isUndefined((props.method as TypescriptMethod).typeParameter) ?
                                  undefined :
                                  renderTypeParameter(
                                      props.method, props.docsInfo, sectionName, props.typeDefinitionByName,
                                  );
    return (
        <span>
            {props.method.callPath}{methodName}{typeParameterIfExists}({paramString})
            {props.shouldUseArrowSyntax ? ' => ' : ': '}
            {' '}
            {props.method.returnType &&
                <Type
                    type={props.method.returnType}
                    sectionName={sectionName}
                    typeDefinitionByName={props.typeDefinitionByName}
                    docsInfo={props.docsInfo}
                />
            }
        </span>
    );
};

MethodSignature.defaultProps = defaultProps;

function renderParameters(
    method: TypescriptMethod|SolidityMethod, docsInfo: DocsInfo,
    sectionName: string, typeDefinitionByName?: TypeDefinitionByName,
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
                {p.name}{isOptional && '?'}: {type}
            </span>
        );
    });
    return params;
}

function renderTypeParameter(
    method: TypescriptMethod, docsInfo: DocsInfo,
    sectionName: string, typeDefinitionByName?: TypeDefinitionByName,
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
