import * as _ from 'lodash';

import { DocsInfo } from '../docs_info';
import {
    CustomType,
    CustomTypeChild,
    DocAgnosticFormat,
    DocSection,
    IndexSignature,
    KindString,
    Parameter,
    Property,
    SectionsMap,
    Type,
    TypeDocNode,
    TypeDocType,
    TypeDocTypes,
    TypeParameter,
    TypescriptFunction,
    TypescriptMethod,
} from '../types';
import { utils } from '../utils/utils';

export const typeDocUtils = {
    isType(entity: TypeDocNode): boolean {
        return (
            entity.kindString === KindString.Interface ||
            entity.kindString === KindString.Function ||
            entity.kindString === KindString.TypeAlias ||
            entity.kindString === KindString.Variable ||
            entity.kindString === KindString.Enumeration
        );
    },
    isMethod(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Method;
    },
    isConstructor(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Constructor;
    },
    isProperty(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Property;
    },
    isPrivateOrProtectedProperty(propertyName: string): boolean {
        return _.startsWith(propertyName, '_');
    },
    getModuleDefinitionsBySectionName(versionDocObj: TypeDocNode, configModulePaths: string[]): TypeDocNode[] {
        const moduleDefinitions: TypeDocNode[] = [];
        const jsonModules = versionDocObj.children;
        _.each(jsonModules, jsonMod => {
            _.each(configModulePaths, configModulePath => {
                if (_.includes(configModulePath, jsonMod.name)) {
                    moduleDefinitions.push(jsonMod);
                }
            });
        });
        return moduleDefinitions;
    },
    convertToDocAgnosticFormat(typeDocJson: TypeDocNode, docsInfo: DocsInfo): DocAgnosticFormat {
        const subMenus = _.values(docsInfo.getMenu());
        const orderedSectionNames = _.flatten(subMenus);
        const docAgnosticFormat: DocAgnosticFormat = {};
        _.each(orderedSectionNames, sectionName => {
            const modulePathsIfExists = docsInfo.getModulePathsIfExists(sectionName);
            if (_.isUndefined(modulePathsIfExists)) {
                return; // no-op
            }
            const packageDefinitions = typeDocUtils.getModuleDefinitionsBySectionName(typeDocJson, modulePathsIfExists);
            let packageDefinitionWithMergedChildren;
            if (_.isEmpty(packageDefinitions)) {
                return; // no-op
            } else if (packageDefinitions.length === 1) {
                packageDefinitionWithMergedChildren = packageDefinitions[0];
            } else {
                // HACK: For now, if there are two modules to display in a single section,
                // we simply concat the children. This works for our limited use-case where
                // we want to display types stored in two files under a single section
                packageDefinitionWithMergedChildren = packageDefinitions[0];
                for (let i = 1; i < packageDefinitions.length; i++) {
                    packageDefinitionWithMergedChildren.children = [
                        ...packageDefinitionWithMergedChildren.children,
                        ...packageDefinitions[i].children,
                    ];
                }
            }

            let entities;
            let packageComment = '';
            // HACK: We assume 1 exported class per file
            const classChildren = _.filter(packageDefinitionWithMergedChildren.children, (child: TypeDocNode) => {
                return child.kindString === KindString.Class;
            });
            if (classChildren.length > 1 && sectionName !== 'types') {
                throw new Error('`react-docs` only supports projects with 1 exported class per file');
            }
            const isClassExport = packageDefinitionWithMergedChildren.children[0].kindString === KindString.Class;
            const isObjectLiteralExport =
                packageDefinitionWithMergedChildren.children[0].kindString === KindString.ObjectLiteral;
            if (isClassExport) {
                entities = packageDefinitionWithMergedChildren.children[0].children;
                const commentObj = packageDefinitionWithMergedChildren.children[0].comment;
                packageComment = !_.isUndefined(commentObj) ? commentObj.shortText : packageComment;
            } else if (isObjectLiteralExport) {
                entities = packageDefinitionWithMergedChildren.children[0].children;
                const commentObj = packageDefinitionWithMergedChildren.children[0].comment;
                packageComment = !_.isUndefined(commentObj) ? commentObj.shortText : packageComment;
            } else {
                entities = packageDefinitionWithMergedChildren.children;
            }

            const docSection = typeDocUtils._convertEntitiesToDocSection(entities, docsInfo, sectionName);
            docSection.comment = packageComment;
            docAgnosticFormat[sectionName] = docSection;
        });
        return docAgnosticFormat;
    },
    _convertEntitiesToDocSection(entities: TypeDocNode[], docsInfo: DocsInfo, sectionName: string): DocSection {
        const docSection: DocSection = {
            comment: '',
            constructors: [],
            methods: [],
            functions: [],
            properties: [],
            types: [],
        };

        let isConstructor;
        _.each(entities, entity => {
            switch (entity.kindString) {
                case KindString.Constructor:
                    isConstructor = true;
                    const constructor = typeDocUtils._convertMethod(
                        entity,
                        isConstructor,
                        docsInfo.sections,
                        sectionName,
                        docsInfo.id,
                    );
                    docSection.constructors.push(constructor);
                    break;

                case KindString.Function:
                    if (entity.flags.isExported) {
                        const func = typeDocUtils._convertFunction(entity, docsInfo.sections, sectionName, docsInfo.id);
                        docSection.functions.push(func);
                    }
                    break;

                case KindString.Method:
                    if (entity.flags.isPublic) {
                        isConstructor = false;
                        const method = typeDocUtils._convertMethod(
                            entity,
                            isConstructor,
                            docsInfo.sections,
                            sectionName,
                            docsInfo.id,
                        );
                        docSection.methods.push(method);
                    }
                    break;

                case KindString.Property:
                    if (!typeDocUtils.isPrivateOrProtectedProperty(entity.name)) {
                        const property = typeDocUtils._convertProperty(
                            entity,
                            docsInfo.sections,
                            sectionName,
                            docsInfo.id,
                        );
                        docSection.properties.push(property);
                    }
                    break;

                case KindString.Interface:
                case KindString.Variable:
                case KindString.Enumeration:
                case KindString.TypeAlias:
                    if (docsInfo.isPublicType(entity.name)) {
                        const customType = typeDocUtils._convertCustomType(
                            entity,
                            docsInfo.sections,
                            sectionName,
                            docsInfo.id,
                        );
                        const seenTypeNames = _.map(docSection.types, t => t.name);
                        const isUnseen = !_.includes(seenTypeNames, customType.name);
                        if (isUnseen) {
                            docSection.types.push(customType);
                        }
                    }
                    break;

                case KindString.Class:
                    // We currently do not support more then a single class per file
                    // except for the types section, where we ignore classes since we
                    // only want to render type definitions.
                    break;

                default:
                    throw utils.spawnSwitchErr('kindString', entity.kindString);
            }
        });
        return docSection;
    },
    _convertCustomType(entity: TypeDocNode, sections: SectionsMap, sectionName: string, docId: string): CustomType {
        const typeIfExists = !_.isUndefined(entity.type)
            ? typeDocUtils._convertType(entity.type, sections, sectionName, docId)
            : undefined;
        const isConstructor = false;
        const methodIfExists = !_.isUndefined(entity.declaration)
            ? typeDocUtils._convertMethod(entity.declaration, isConstructor, sections, sectionName, docId)
            : undefined;
        const doesIndexSignatureExist = !_.isUndefined(entity.indexSignature);
        const isIndexSignatureArray = _.isArray(entity.indexSignature);
        // HACK: TypeDoc Versions <0.9.0 indexSignature is of type TypeDocNode[]
        // Versions >0.9.0 have it as type TypeDocNode
        const indexSignature =
            doesIndexSignatureExist && isIndexSignatureArray
                ? (entity.indexSignature as TypeDocNode[])[0]
                : (entity.indexSignature as TypeDocNode);
        const indexSignatureIfExists = doesIndexSignatureExist
            ? typeDocUtils._convertIndexSignature(indexSignature, sections, sectionName, docId)
            : undefined;
        const commentIfExists =
            !_.isUndefined(entity.comment) && !_.isUndefined(entity.comment.shortText)
                ? entity.comment.shortText
                : undefined;

        const childrenIfExist = !_.isUndefined(entity.children)
            ? _.map(entity.children, (child: TypeDocNode) => {
                  let childTypeIfExists = !_.isUndefined(child.type)
                      ? typeDocUtils._convertType(child.type, sections, sectionName, docId)
                      : undefined;
                  if (child.kindString === KindString.Method) {
                      childTypeIfExists = {
                          name: child.name,
                          typeDocType: TypeDocTypes.Reflection,
                          method: this._convertMethod(child, isConstructor, sections, sectionName, docId),
                      };
                  }
                  const c: CustomTypeChild = {
                      name: child.name,
                      type: childTypeIfExists,
                      defaultValue: child.defaultValue,
                  };
                  return c;
              })
            : undefined;

        const customType = {
            name: entity.name,
            kindString: entity.kindString,
            type: typeIfExists,
            method: methodIfExists,
            indexSignature: indexSignatureIfExists,
            defaultValue: entity.defaultValue,
            comment: commentIfExists,
            children: childrenIfExist,
        };
        return customType;
    },
    _convertIndexSignature(
        entity: TypeDocNode,
        sections: SectionsMap,
        sectionName: string,
        docId: string,
    ): IndexSignature {
        const key = entity.parameters[0];
        const indexSignature = {
            keyName: key.name,
            keyType: typeDocUtils._convertType(key.type, sections, sectionName, docId),
            valueName: entity.type.name,
        };
        return indexSignature;
    },
    _convertProperty(entity: TypeDocNode, sections: SectionsMap, sectionName: string, docId: string): Property {
        const source = entity.sources[0];
        const commentIfExists = !_.isUndefined(entity.comment) ? entity.comment.shortText : undefined;
        const property = {
            name: entity.name,
            type: typeDocUtils._convertType(entity.type, sections, sectionName, docId),
            source: {
                fileName: source.fileName,
                line: source.line,
            },
            comment: commentIfExists,
        };
        return property;
    },
    _convertMethod(
        entity: TypeDocNode,
        isConstructor: boolean,
        sections: SectionsMap,
        sectionName: string,
        docId: string,
    ): TypescriptMethod {
        const signature = entity.signatures[0];
        const source = entity.sources[0];
        const hasComment = !_.isUndefined(signature.comment);
        const isStatic = _.isUndefined(entity.flags.isStatic) ? false : entity.flags.isStatic;

        // HACK: we use the fact that the sectionName is the same as the property name at the top-level
        // of the public interface. In the future, we shouldn't use this hack but rather get it from the JSON.
        let callPath;
        if (isConstructor || entity.name === '__type') {
            callPath = '';
            // TODO: Get rid of this 0x-specific logic
        } else if (docId === 'ZERO_EX_JS') {
            const topLevelInterface = isStatic ? 'ZeroEx.' : 'zeroEx.';
            callPath =
                !_.isUndefined(sections.zeroEx) && sectionName !== sections.zeroEx
                    ? `${topLevelInterface}${sectionName}.`
                    : topLevelInterface;
        } else {
            callPath = `${sectionName}.`;
        }

        const parameters = _.map(signature.parameters, param => {
            return typeDocUtils._convertParameter(param, sections, sectionName, docId);
        });
        const returnType = typeDocUtils._convertType(signature.type, sections, sectionName, docId);
        const typeParameter = _.isUndefined(signature.typeParameter)
            ? undefined
            : typeDocUtils._convertTypeParameter(signature.typeParameter[0], sections, sectionName, docId);

        const method = {
            isConstructor,
            isStatic,
            name: signature.name,
            comment: hasComment ? signature.comment.shortText : undefined,
            returnComment: hasComment && signature.comment.returns ? signature.comment.returns : undefined,
            source: {
                fileName: source.fileName,
                line: source.line,
            },
            callPath,
            parameters,
            returnType,
            typeParameter,
        };
        return method;
    },
    _convertFunction(
        entity: TypeDocNode,
        sections: SectionsMap,
        sectionName: string,
        docId: string,
    ): TypescriptFunction {
        const signature = entity.signatures[0];
        const source = entity.sources[0];
        const hasComment = !_.isUndefined(signature.comment);

        const parameters = _.map(signature.parameters, param => {
            return typeDocUtils._convertParameter(param, sections, sectionName, docId);
        });
        const returnType = typeDocUtils._convertType(signature.type, sections, sectionName, docId);
        const typeParameter = _.isUndefined(signature.typeParameter)
            ? undefined
            : typeDocUtils._convertTypeParameter(signature.typeParameter[0], sections, sectionName, docId);

        const func = {
            name: signature.name,
            comment: hasComment ? signature.comment.shortText : undefined,
            returnComment: hasComment && signature.comment.returns ? signature.comment.returns : undefined,
            source: {
                fileName: source.fileName,
                line: source.line,
            },
            parameters,
            returnType,
            typeParameter,
        };
        return func;
    },
    _convertTypeParameter(
        entity: TypeDocNode,
        sections: SectionsMap,
        sectionName: string,
        docId: string,
    ): TypeParameter {
        const type = typeDocUtils._convertType(entity.type, sections, sectionName, docId);
        const parameter = {
            name: entity.name,
            type,
        };
        return parameter;
    },
    _convertParameter(entity: TypeDocNode, sections: SectionsMap, sectionName: string, docId: string): Parameter {
        let comment = '<No comment>';
        if (entity.comment && entity.comment.shortText) {
            comment = entity.comment.shortText;
        } else if (entity.comment && entity.comment.text) {
            comment = entity.comment.text;
        }

        const isOptional = !_.isUndefined(entity.flags.isOptional) ? entity.flags.isOptional : false;

        const type = typeDocUtils._convertType(entity.type, sections, sectionName, docId);

        const parameter = {
            name: entity.name,
            comment,
            isOptional,
            defaultValue: entity.defaultValue,
            type,
        };
        return parameter;
    },
    _convertType(entity: TypeDocType, sections: SectionsMap, sectionName: string, docId: string): Type {
        const typeArguments = _.map(entity.typeArguments, typeArgument => {
            return typeDocUtils._convertType(typeArgument, sections, sectionName, docId);
        });
        const types = _.map(entity.types, t => {
            return typeDocUtils._convertType(t, sections, sectionName, docId);
        });

        const isConstructor = false;
        const methodIfExists = !_.isUndefined(entity.declaration)
            ? typeDocUtils._convertMethod(entity.declaration, isConstructor, sections, sectionName, docId)
            : undefined;

        const elementTypeIfExists = !_.isUndefined(entity.elementType)
            ? {
                  name: entity.elementType.name,
                  typeDocType: entity.elementType.type,
              }
            : undefined;

        const type = {
            name: entity.name,
            value: entity.value,
            typeDocType: entity.type,
            typeArguments,
            elementType: elementTypeIfExists,
            types,
            method: methodIfExists,
        };
        return type;
    },
};
