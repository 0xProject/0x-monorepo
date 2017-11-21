import * as _ from 'lodash';
import * as React from 'react';
import {TypescriptMethod, SolidityMethod, TypeDefinitionByName, Parameter} from 'ts/types';
import {Type} from 'ts/pages/documentation/type';

interface MethodSignatureProps {
    method: TypescriptMethod|SolidityMethod;
    shouldHideMethodName?: boolean;
    shouldUseArrowSyntax?: boolean;
    typeDefinitionByName?: TypeDefinitionByName;
}

const defaultProps = {
    shouldHideMethodName: false,
    shouldUseArrowSyntax: false,
};

export const MethodSignature: React.SFC<MethodSignatureProps> = (props: MethodSignatureProps) => {
    const parameters = renderParameters(props.method, props.typeDefinitionByName);
    const paramString = _.reduce(parameters, (prev: React.ReactNode, curr: React.ReactNode) => {
        return [prev, ', ', curr];
    });
    const methodName = props.shouldHideMethodName ? '' : props.method.name;
    const typeParameterIfExists = _.isUndefined((props.method as TypescriptMethod).typeParameter) ?
                                  undefined :
                                  renderTypeParameter(props.method, props.typeDefinitionByName);
    return (
        <span>
            {props.method.callPath}{methodName}{typeParameterIfExists}({paramString})
            {props.shouldUseArrowSyntax ? ' => ' : ': '}
            {' '}
            {props.method.returnType &&
                <Type type={props.method.returnType} typeDefinitionByName={props.typeDefinitionByName}/>
            }
        </span>
    );
};

function renderParameters(method: TypescriptMethod|SolidityMethod, typeDefinitionByName?: TypeDefinitionByName) {
    const parameters = method.parameters;
    const params = _.map(parameters, (p: Parameter) => {
        const isOptional = p.isOptional;
        return (
            <span key={`param-${p.type}-${p.name}`}>
                {p.name}{isOptional && '?'}: <Type type={p.type} typeDefinitionByName={typeDefinitionByName}/>
            </span>
        );
    });
    return params;
}

function renderTypeParameter(method: TypescriptMethod, typeDefinitionByName?: TypeDefinitionByName) {
    const typeParameter = method.typeParameter;
    const typeParam = (
        <span>
            {`<${typeParameter.name} extends `}
                <Type type={typeParameter.type} typeDefinitionByName={typeDefinitionByName}/>
            {`>`}
        </span>
    );
    return typeParam;
}
