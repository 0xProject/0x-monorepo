import { errorUtils } from '@0xproject/utils';
import * as _ from 'lodash';

import { DocsInfo } from '../docs_info';
import {
    CustomType,
    CustomTypeChild,
    DocAgnosticFormat,
    DocSection,
    GeneratedDocJson,
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

import { constants } from './constants';

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
    convertToDocAgnosticFormat(generatedDocJson: GeneratedDocJson, docsInfo: DocsInfo): DocAgnosticFormat {
        const exportPathOrder = generatedDocJson.metadata.exportPathOrder;
        const exportPathToTypedocNames = generatedDocJson.metadata.exportPathToTypedocNames;
        const typeDocJson = generatedDocJson.typedocJson;

        // TODO: Extract the non typeDoc exports, and render them somehow
        const typeDocNameOrder = _.compact(
            _.flatten(
                _.map(exportPathOrder, exportPath => {
                    return exportPathToTypedocNames[exportPath];
                }),
            ),
        );

        const classNames: string[] = [];
        _.each(typeDocJson.children, file => {
            _.each(file.children, child => {
                if (child.kindString === KindString.Class) {
                    classNames.push(child.name);
                }
            });
        });

        const docAgnosticFormat: DocAgnosticFormat = {};
        const typeEntities: TypeDocNode[] = [];
        _.each(typeDocNameOrder, typeDocName => {
            const fileChildIndex = _.findIndex(typeDocJson.children, child => child.name === typeDocName);
            const fileChild = typeDocJson.children[fileChildIndex];
            let sectionName: string;
            _.each(fileChild.children, child => {
                switch (child.kindString) {
                    case KindString.Class:
                    case KindString.ObjectLiteral: {
                        sectionName = child.name;
                        docsInfo.sections[sectionName] = sectionName;
                        docsInfo.menu[sectionName] = [sectionName];
                        const entities = child.children;
                        const commentObj = child.comment;
                        const sectionComment = !_.isUndefined(commentObj) ? commentObj.shortText : '';
                        const isClassOrObjectLiteral = true;
                        const docSection = typeDocUtils._convertEntitiesToDocSection(
                            entities,
                            docsInfo,
                            sectionName,
                            classNames,
                            isClassOrObjectLiteral,
                        );
                        docSection.comment = sectionComment;
                        docAgnosticFormat[sectionName] = docSection;
                        break;
                    }
                    case KindString.Function: {
                        sectionName = child.name;
                        docsInfo.sections[sectionName] = sectionName;
                        docsInfo.menu[sectionName] = [sectionName];
                        const entities = [child];
                        const commentObj = child.comment;
                        const SectionComment = !_.isUndefined(commentObj) ? commentObj.shortText : '';
                        const docSection = typeDocUtils._convertEntitiesToDocSection(
                            entities,
                            docsInfo,
                            sectionName,
                            classNames,
                        );
                        docSection.comment = SectionComment;
                        docAgnosticFormat[sectionName] = docSection;
                        break;
                    }
                    case KindString.Interface:
                    case KindString.Variable:
                    case KindString.Enumeration:
                    case KindString.TypeAlias:
                        typeEntities.push(child);
                        break;
                    default:
                        throw errorUtils.spawnSwitchErr('kindString', child.kindString);
                }
            });
        });
        if (!_.isEmpty(typeEntities)) {
            docsInfo.sections[constants.TYPES_SECTION_NAME] = constants.TYPES_SECTION_NAME;
            docsInfo.menu[constants.TYPES_SECTION_NAME] = [constants.TYPES_SECTION_NAME];
            const docSection = typeDocUtils._convertEntitiesToDocSection(
                typeEntities,
                docsInfo,
                constants.TYPES_SECTION_NAME,
                classNames,
            );
            docAgnosticFormat[constants.TYPES_SECTION_NAME] = docSection;
        }

        return docAgnosticFormat;
    },
    _convertEntitiesToDocSection(
        entities: TypeDocNode[],
        docsInfo: DocsInfo,
        sectionName: string,
        classNames: string[],
        isClassOrObjectLiteral: boolean = false,
    ): DocSection {
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
                        classNames,
                    );
                    docSection.constructors.push(constructor);
                    break;

                case KindString.Function:
                    if (entity.flags.isExported) {
                        const funcName = (entity as TypeDocNode).signatures[0].name;
                        const isPublicFunc = !_.startsWith(funcName, '_');
                        if (isPublicFunc) {
                            const func = typeDocUtils._convertFunction(
                                entity,
                                docsInfo.sections,
                                sectionName,
                                docsInfo.id,
                                isClassOrObjectLiteral,
                                classNames,
                            );
                            docSection.functions.push(func);
                        }
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
                            classNames,
                        );
                        docSection.methods.push(method);
                    }
                    break;

                case KindString.Property:
                    const property = typeDocUtils._convertProperty(
                        entity,
                        docsInfo.sections,
                        sectionName,
                        docsInfo.id,
                        classNames,
                    );
                    docSection.properties.push(property);
                    break;

                case KindString.Variable:
                    if (isClassOrObjectLiteral) {
                        // Render as a property
                        const property = typeDocUtils._convertProperty(
                            entity,
                            docsInfo.sections,
                            sectionName,
                            docsInfo.id,
                            classNames,
                        );
                        docSection.properties.push(property);
                    } else {
                        // Otherwise, render as a type
                        const customType = typeDocUtils._convertCustomType(
                            entity,
                            docsInfo.sections,
                            sectionName,
                            docsInfo.id,
                            classNames,
                        );
                        const seenTypeNames = _.map(docSection.types, t => t.name);
                        const isUnseen = !_.includes(seenTypeNames, customType.name);
                        if (isUnseen) {
                            docSection.types.push(customType);
                        }
                    }
                    break;

                case KindString.Interface:
                case KindString.Enumeration:
                case KindString.TypeAlias: {
                    const customType = typeDocUtils._convertCustomType(
                        entity,
                        docsInfo.sections,
                        sectionName,
                        docsInfo.id,
                        classNames,
                    );
                    const seenTypeNames = _.map(docSection.types, t => t.name);
                    const isUnseen = !_.includes(seenTypeNames, customType.name);
                    if (isUnseen) {
                        docSection.types.push(customType);
                    }
                    break;
                }

                case KindString.Class:
                    // We currently do not support more then a single class per file
                    // except for the types section, where we ignore classes since we
                    // only want to render type definitions.
                    break;

                default:
                    throw errorUtils.spawnSwitchErr('kindString', entity.kindString);
            }
        });
        return docSection;
    },
    _convertCustomType(
        entity: TypeDocNode,
        sections: SectionsMap,
        sectionName: string,
        docId: string,
        classNames: string[],
    ): CustomType {
        const typeIfExists = !_.isUndefined(entity.type)
            ? typeDocUtils._convertType(entity.type, sections, sectionName, docId, classNames)
            : undefined;
        const isConstructor = false;
        const methodIfExists = !_.isUndefined(entity.declaration)
            ? typeDocUtils._convertMethod(entity.declaration, isConstructor, sections, sectionName, docId, classNames)
            : undefined;
        const doesIndexSignatureExist = !_.isUndefined(entity.indexSignature);
        const indexSignature = entity.indexSignature as TypeDocNode;
        const indexSignatureIfExists = doesIndexSignatureExist
            ? typeDocUtils._convertIndexSignature(indexSignature, sections, sectionName, docId, classNames)
            : undefined;
        const commentIfExists =
            !_.isUndefined(entity.comment) && !_.isUndefined(entity.comment.shortText)
                ? entity.comment.shortText
                : undefined;

        const childrenIfExist = !_.isUndefined(entity.children)
            ? _.map(entity.children, (child: TypeDocNode) => {
                  let childTypeIfExists = !_.isUndefined(child.type)
                      ? typeDocUtils._convertType(child.type, sections, sectionName, docId, classNames)
                      : undefined;
                  if (child.kindString === KindString.Method) {
                      childTypeIfExists = {
                          name: child.name,
                          typeDocType: TypeDocTypes.Reflection,
                          method: typeDocUtils._convertMethod(
                              child,
                              isConstructor,
                              sections,
                              sectionName,
                              docId,
                              classNames,
                          ),
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
        classNames: string[],
    ): IndexSignature {
        const key = entity.parameters[0];
        const indexSignature = {
            keyName: key.name,
            keyType: typeDocUtils._convertType(key.type, sections, sectionName, docId, classNames),
            valueName: entity.type.name,
        };
        return indexSignature;
    },
    _convertProperty(
        entity: TypeDocNode,
        sections: SectionsMap,
        sectionName: string,
        docId: string,
        classNames: string[],
    ): Property {
        const source = entity.sources[0];
        const commentIfExists = !_.isUndefined(entity.comment) ? entity.comment.shortText : undefined;
        const isConstructor = false;
        const isStatic = _.isUndefined(entity.flags.isStatic) ? false : entity.flags.isStatic;
        const callPath = typeDocUtils._getCallPath(sectionName, isStatic, isConstructor, entity.name);
        const property = {
            name: entity.name,
            type: typeDocUtils._convertType(entity.type, sections, sectionName, docId, classNames),
            source: {
                fileName: source.fileName,
                line: source.line,
            },
            comment: commentIfExists,
            callPath,
        };
        return property;
    },
    _convertMethod(
        entity: TypeDocNode,
        isConstructor: boolean,
        sections: SectionsMap,
        sectionName: string,
        docId: string,
        classNames: string[],
    ): TypescriptMethod {
        const signature = entity.signatures[0];
        const source = entity.sources[0];
        const hasComment = !_.isUndefined(signature.comment);
        const isStatic = _.isUndefined(entity.flags.isStatic) ? false : entity.flags.isStatic;

        const parameters = _.map(signature.parameters, param => {
            return typeDocUtils._convertParameter(param, sections, sectionName, docId, classNames);
        });
        const returnType = typeDocUtils._convertType(signature.type, sections, sectionName, docId, classNames);
        const typeParameter = _.isUndefined(signature.typeParameter)
            ? undefined
            : typeDocUtils._convertTypeParameter(signature.typeParameter[0], sections, sectionName, docId, classNames);

        const callPath = typeDocUtils._getCallPath(sectionName, isStatic, isConstructor, entity.name);
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
    _getCallPath(sectionName: string, isStatic: boolean, isConstructor: boolean, entityName: string): string {
        // HACK: we use the fact that the sectionName is the same as the property name at the top-level
        // of the public interface. In the future, we shouldn't use this hack but rather get it from the JSON.
        let callPath;
        if (isConstructor || entityName === '__type') {
            callPath = '';
        } else {
            const prefix = isStatic ? sectionName : `${sectionName[0].toLowerCase()}${sectionName.slice(1)}`;
            callPath = `${prefix}.`;
        }
        return callPath;
    },
    _convertFunction(
        entity: TypeDocNode,
        sections: SectionsMap,
        sectionName: string,
        docId: string,
        isObjectLiteral: boolean,
        classNames: string[],
    ): TypescriptFunction {
        const signature = entity.signatures[0];
        const source = entity.sources[0];
        const hasComment = !_.isUndefined(signature.comment);

        const parameters = _.map(signature.parameters, param => {
            return typeDocUtils._convertParameter(param, sections, sectionName, docId, classNames);
        });
        const returnType = typeDocUtils._convertType(signature.type, sections, sectionName, docId, classNames);
        const typeParameter = _.isUndefined(signature.typeParameter)
            ? undefined
            : typeDocUtils._convertTypeParameter(signature.typeParameter[0], sections, sectionName, docId, classNames);

        let callPath = '';
        if (isObjectLiteral) {
            const isConstructor = false;
            const isStatic = false;
            callPath = typeDocUtils._getCallPath(sectionName, isStatic, isConstructor, entity.name);
        }
        const func = {
            name: signature.name,
            comment: hasComment ? signature.comment.shortText : undefined,
            returnComment: hasComment && signature.comment.returns ? signature.comment.returns : undefined,
            callPath,
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
        classNames: string[],
    ): TypeParameter {
        const type = typeDocUtils._convertType(entity.type, sections, sectionName, docId, classNames);
        const parameter = {
            name: entity.name,
            type,
        };
        return parameter;
    },
    _convertParameter(
        entity: TypeDocNode,
        sections: SectionsMap,
        sectionName: string,
        docId: string,
        classNames: string[],
    ): Parameter {
        let comment = '<No comment>';
        if (entity.comment && entity.comment.shortText) {
            comment = entity.comment.shortText;
        } else if (entity.comment && entity.comment.text) {
            comment = entity.comment.text;
        }

        const isOptional = !_.isUndefined(entity.flags.isOptional) ? entity.flags.isOptional : false;

        const type = typeDocUtils._convertType(entity.type, sections, sectionName, docId, classNames);

        const parameter = {
            name: entity.name,
            comment,
            isOptional,
            defaultValue: entity.defaultValue,
            type,
        };
        return parameter;
    },
    _convertType(
        entity: TypeDocType,
        sections: SectionsMap,
        sectionName: string,
        docId: string,
        classNames: string[],
    ): Type {
        const typeArguments = _.map(entity.typeArguments, typeArgument => {
            return typeDocUtils._convertType(typeArgument, sections, sectionName, docId, classNames);
        });
        const types = _.map(entity.types, t => {
            return typeDocUtils._convertType(t, sections, sectionName, docId, classNames);
        });

        let indexSignatureIfExists;
        let methodIfExists;
        const doesIndexSignatureExist =
            !_.isUndefined(entity.declaration) && !_.isUndefined(entity.declaration.indexSignature);
        if (doesIndexSignatureExist) {
            const indexSignature = entity.declaration.indexSignature as TypeDocNode;
            indexSignatureIfExists = typeDocUtils._convertIndexSignature(
                indexSignature,
                sections,
                sectionName,
                docId,
                classNames,
            );
        } else if (!_.isUndefined(entity.declaration)) {
            const isConstructor = false;
            methodIfExists = typeDocUtils._convertMethod(
                entity.declaration,
                isConstructor,
                sections,
                sectionName,
                docId,
                classNames,
            );
        }

        const elementTypeIfExists = !_.isUndefined(entity.elementType)
            ? {
                  name: entity.elementType.name,
                  typeDocType: entity.elementType.type,
              }
            : undefined;

        const type = {
            name: entity.name,
            value: entity.value,
            isExportedClassReference: _.includes(classNames, entity.name),
            typeDocType: entity.type,
            typeArguments,
            elementType: elementTypeIfExists,
            types,
            method: methodIfExists,
            indexSignature: indexSignatureIfExists,
        };
        return type;
    },
};
