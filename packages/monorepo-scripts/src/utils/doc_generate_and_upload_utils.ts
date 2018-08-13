import * as _ from 'lodash';

import { constants } from '../constants';
import { utils } from './utils';

import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import * as ts from 'typescript';

import { ExportPathToExportedItems } from '../types';

interface ExportInfo {
    exportPathToExportedItems: ExportPathToExportedItems;
    exportPathOrder: string[];
}

interface ExportNameToTypedocNames {
    [exportName: string]: string[];
}

export async function generateAndUploadDocsAsync(packageName: string, isStaging: boolean): Promise<void> {
    const monorepoPackages = utils.getPackages(constants.monorepoRootPath);
    const pkg = _.find(monorepoPackages, monorepoPackage => {
        return _.includes(monorepoPackage.packageJson.name, packageName);
    });
    if (_.isUndefined(pkg)) {
        throw new Error(`Couldn't find a package.json for ${packageName}`);
    }

    const packageJson = pkg.packageJson;
    const omitExports = _.get(packageJson, 'config.postpublish.omitExports', []);

    const pathToPackage = `${constants.monorepoRootPath}/packages/${packageName}`;
    const indexPath = `${pathToPackage}/src/index.ts`;
    const { exportPathToExportedItems, exportPathOrder } = getExportPathToExportedItems(indexPath, omitExports);

    const shouldPublishDocs = !!_.get(packageJson, 'config.postpublish.shouldPublishDocs');
    if (!shouldPublishDocs) {
        utils.log(
            `GENERATE_UPLOAD_DOCS: ${
                packageJson.name
            } packageJson.config.postpublish.shouldPublishDocs is false. Skipping doc JSON generation.`,
        );
        return;
    }

    const pkgNameToPath: { [name: string]: string } = {};
    _.each(monorepoPackages, pkg => {
        pkgNameToPath[pkg.packageJson.name] = pkg.location;
    });

    // For each dep that is another one of our monorepo packages, we fetch it's index.ts
    // and see which specific files we must pass to TypeDoc.
    let typeDocExtraFileIncludes: string[] = [];
    _.each(exportPathToExportedItems, (exportedItems, exportPath) => {
        const isInternalToPkg = _.startsWith(exportPath, '.');
        if (isInternalToPkg) {
            const pathToInternalPkg = path.join(pathToPackage, 'src', `${exportPath}.ts`);
            typeDocExtraFileIncludes.push(pathToInternalPkg);
            return;
        }

        const pathIfExists = pkgNameToPath[exportPath];
        if (_.isUndefined(pathIfExists)) {
            return; // It's an external package
        }

        const typeDocSourceIncludes = new Set();
        const pathToIndex = `${pathIfExists}/src/index.ts`;
        const exportInfo = getExportPathToExportedItems(pathToIndex);
        const innerExportPathToExportedItems = exportInfo.exportPathToExportedItems;
        _.each(exportedItems, exportName => {
            _.each(innerExportPathToExportedItems, (innerExportItems, innerExportPath) => {
                if (!_.includes(innerExportItems, exportName)) {
                    return;
                }
                if (!_.startsWith(innerExportPath, './')) {
                    throw new Error(
                        `GENERATE_UPLOAD_DOCS: WARNING - ${packageName} is exporting one of ${innerExportItems} which is 
                        itself exported from an external package. To fix this, export the external dependency directly, 
                        not indirectly through ${innerExportPath}.`,
                    );
                } else {
                    const absoluteSrcPath = path.join(pathIfExists, 'src', `${innerExportPath}.ts`);
                    typeDocSourceIncludes.add(absoluteSrcPath);
                }
            });
        });
        // @0xproject/types & ethereum-types are examples of packages where their index.ts exports types
        // directly, meaning no internal paths will exist to follow. Other packages also have direct exports
        // in their index.ts, so we always add it to the source files passed to TypeDoc
        if (typeDocSourceIncludes.size === 0) {
            typeDocSourceIncludes.add(pathToIndex);
        }

        typeDocExtraFileIncludes = [...typeDocExtraFileIncludes, ...Array.from(typeDocSourceIncludes)];
    });

    // Generate Typedoc JSON file
    typeDocExtraFileIncludes.push(path.join(pathToPackage, 'src', 'globals.d.ts'));
    const jsonFilePath = path.join(pathToPackage, 'generated_docs', 'index.json');
    const projectFiles = typeDocExtraFileIncludes.join(' ');
    const cwd = path.join(constants.monorepoRootPath, 'packages', packageName);
    // HACK: For some reason calling `typedoc` command directly from here, even with `cwd` set to the
    // packages root dir, does not work. It only works when called via a `package.json` script located
    // in the package's root.
    await execAsync(`JSON_FILE_PATH=${jsonFilePath} PROJECT_FILES="${projectFiles}" yarn docs:json`, {
        cwd,
    });

    // Unfortunately TypeDoc children names will only be prefixed with the name of the package _if_ we passed
    // TypeDoc files outside of the packages root path (i.e this package exports another package found in our
    // monorepo). In order to enforce that the names are always prefixed with the package's name, we check and add
    // it here when necessary.
    const typedocOutputString = readFileSync(jsonFilePath).toString();
    const typedocOutput = JSON.parse(typedocOutputString);
    const finalTypeDocOutput = _.clone(typedocOutput);
    _.each(typedocOutput.children, (child, i) => {
        if (!_.includes(child.name, '/src/')) {
            const nameWithoutQuotes = child.name.replace(/"/g, '');
            const standardizedName = `"${packageName}/src/${nameWithoutQuotes}"`;
            finalTypeDocOutput.children[i].name = standardizedName;
        }
    });

    // For each entry, see if it was exported in index.ts. If not, remove it.
    const exportPathToTypedocNames: ExportNameToTypedocNames = {};
    _.each(typedocOutput.children, (file, i) => {
        const exportPath = findExportPathGivenTypedocName(exportPathToExportedItems, packageName, file.name);
        exportPathToTypedocNames[exportPath] = _.isUndefined(exportPathToTypedocNames[exportPath])
            ? [file.name]
            : [...exportPathToTypedocNames[exportPath], file.name];

        const exportItems = exportPathToExportedItems[exportPath];
        _.each(file.children, (child, j) => {
            if (!_.includes(exportItems, child.name)) {
                delete finalTypeDocOutput.children[i].children[j];
            }
        });
        finalTypeDocOutput.children[i].children = _.compact(finalTypeDocOutput.children[i].children);
    });

    // TODO: Add extra metadata for Class properties that are class instances
    // Look in file for imports of that class, get the import name and construct a link to
    // it's definition on another docs page.

    // Since we need additional metadata included in the doc JSON, we nest the TypeDoc JSON
    const docJson = {
        metadata: {
            exportPathToTypedocNames,
            exportPathOrder,
        },
        typedocJson: finalTypeDocOutput,
    };

    // Write modified TypeDoc JSON, without all the unexported stuff
    writeFileSync(jsonFilePath, JSON.stringify(docJson, null, 2));

    const fileName = `v${packageJson.version}.json`;
    utils.log(`GENERATE_UPLOAD_DOCS: Doc generation successful, uploading docs... as ${fileName}`);
    const S3BucketPath = isStaging ? `s3://staging-doc-jsons/${packageName}/` : `s3://doc-jsons/${packageName}/`;
    const s3Url = `${S3BucketPath}${fileName}`;
    await execAsync(
        `aws s3 cp ${jsonFilePath} ${s3Url} --profile 0xproject --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers --content-type application/json`,
        {
            cwd,
        },
    );
    utils.log(`GENERATE_UPLOAD_DOCS: Docs uploaded to S3 bucket: ${S3BucketPath}`);
    // Remove the generated docs directory
    await execAsync(`rm -rf ${jsonFilePath}`, {
        cwd,
    });
}

function findExportPathGivenTypedocName(
    exportPathToExportedItems: ExportPathToExportedItems,
    packageName: string,
    typedocName: string,
): string {
    const typeDocNameWithoutQuotes = _.replace(typedocName, /"/g, '');
    const sanitizedExportPathToExportPath: { [sanitizedName: string]: string } = {};
    const exportPaths = _.keys(exportPathToExportedItems);
    const sanitizedExportPaths = _.map(exportPaths, exportPath => {
        if (_.startsWith(exportPath, './')) {
            const sanitizedExportPath = path.join(packageName, 'src', exportPath);
            sanitizedExportPathToExportPath[sanitizedExportPath] = exportPath;
            return sanitizedExportPath;
        }
        const monorepoPrefix = '@0xproject/';
        if (_.startsWith(exportPath, monorepoPrefix)) {
            const sanitizedExportPath = exportPath.split(monorepoPrefix)[1];
            sanitizedExportPathToExportPath[sanitizedExportPath] = exportPath;
            return sanitizedExportPath;
        }
        sanitizedExportPathToExportPath[exportPath] = exportPath;
        return exportPath;
    });
    // We need to sort the exportPaths by length (longest first), so that the match finding will pick
    // longer matches before shorter matches, since it might match both, but the longer match is more
    // precisely what we are looking for.
    const sanitizedExportPathsSortedByLength = sanitizedExportPaths.sort((a: string, b: string) => {
        return b.length - a.length;
    });
    const matchingSanitizedExportPathIfExists = _.find(sanitizedExportPathsSortedByLength, p => {
        return _.startsWith(typeDocNameWithoutQuotes, p);
    });
    if (_.isUndefined(matchingSanitizedExportPathIfExists)) {
        throw new Error(`Didn't find an exportPath for ${typeDocNameWithoutQuotes}`);
    }
    const matchingExportPath = sanitizedExportPathToExportPath[matchingSanitizedExportPathIfExists];
    return matchingExportPath;
}

function getExportPathToExportedItems(filePath: string, omitExports?: string[]): ExportInfo {
    const sourceFile = ts.createSourceFile(
        'indexFile',
        readFileSync(filePath).toString(),
        ts.ScriptTarget.ES2017,
        /*setParentNodes */ true,
    );
    const exportInfo = _getExportPathToExportedItems(sourceFile, omitExports);
    return exportInfo;
}

function _getExportPathToExportedItems(sf: ts.SourceFile, omitExports?: string[]): ExportInfo {
    const exportPathToExportedItems: ExportPathToExportedItems = {};
    const exportPathOrder: string[] = [];
    const exportsToOmit = _.isUndefined(omitExports) ? [] : omitExports;
    processNode(sf);

    function processNode(node: ts.Node): void {
        switch (node.kind) {
            case ts.SyntaxKind.ExportDeclaration: {
                const exportClause = (node as any).exportClause;
                const exportPath = exportClause.parent.moduleSpecifier.text;
                _.each(exportClause.elements, element => {
                    const exportItem = element.name.escapedText;
                    if (!_.includes(exportsToOmit, exportItem)) {
                        exportPathToExportedItems[exportPath] = _.isUndefined(exportPathToExportedItems[exportPath])
                            ? [exportItem]
                            : [...exportPathToExportedItems[exportPath], exportItem];
                    }
                });
                if (!_.isUndefined(exportPathToExportedItems[exportPath])) {
                    exportPathOrder.push(exportPath);
                }
                break;
            }

            case ts.SyntaxKind.ExportKeyword: {
                const foundNode: any = node;
                const exportPath = './index';
                if (foundNode.parent && foundNode.parent.name) {
                    const exportItem = foundNode.parent.name.escapedText;
                    if (!_.includes(exportsToOmit, exportItem)) {
                        exportPathToExportedItems[exportPath] = _.isUndefined(exportPathToExportedItems[exportPath])
                            ? [exportItem]
                            : [...exportPathToExportedItems[exportPath], exportItem];
                    }
                }
                if (!_.includes(exportPathOrder, exportPath) && !_.isUndefined(exportPathToExportedItems[exportPath])) {
                    exportPathOrder.push(exportPath);
                }
                break;
            }
            default:
                // noop
                break;
        }

        ts.forEachChild(node, processNode);
    }
    const exportInfo = {
        exportPathToExportedItems,
        exportPathOrder,
    };
    return exportInfo;
}
