import { readFileSync, writeFileSync } from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import * as ts from 'typescript';
import * as yargs from 'yargs';

import { constants } from './constants';
import { ExportPathToExportedItems } from './types';
import { utils } from './utils/utils';

const args = yargs
    .option('package', {
        describe: 'Monorepo sub-package for which to generate DocJSON',
        type: 'string',
        demandOption: true,
    })
    .option('isStaging', {
        describe: 'Whether we wish to publish docs to staging or production',
        type: 'boolean',
        demandOption: true,
    })
    .example("$0 --package '0x.js' --isStaging true", 'Full usage example').argv;

(async () => {
    console.log('I RAN! - generateAndUploadDocsAsync');
    const packageName = args.package;
    const isStaging = args.isStaging;
    if (_.isEmpty(packageName)) {
        return; // We are not runninng in a command-line env.
    }

    await generateAndUploadDocsAsync(packageName, isStaging);
})();

export async function generateAndUploadDocsAsync(packageName: string, isStaging: boolean): Promise<void> {
    const pathToPackage = `${constants.monorepoRootPath}/packages/${packageName}`;
    const indexPath = `${pathToPackage}/src/index.ts`;
    const exportPathToExportedItems = getExportPathToExportedItems(indexPath);

    const monorepoPackages = utils.getPackages(constants.monorepoRootPath);
    const pkg = _.find(monorepoPackages, monorepoPackage => {
        return _.includes(monorepoPackage.packageJson.name, packageName);
    });
    if (_.isUndefined(pkg)) {
        throw new Error(`Couldn't find a package.json for ${packageName}`);
    }

    const packageJson = pkg.packageJson;
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
        const pathIfExists = pkgNameToPath[exportPath];
        if (_.isUndefined(pathIfExists)) {
            return; // It's an external package
        }

        const isInternalToPkg = _.startsWith(exportPath, '.');
        if (isInternalToPkg) {
            const pathToInternalPkg = path.join(pathToPackage, 'src', `${exportPath}.ts`);
            typeDocExtraFileIncludes.push(pathToInternalPkg);
        }
        const typeDocSourceIncludes = new Set();
        const pathToIndex = `${pathIfExists}/src/index.ts`;
        const innerExportPathToExportedItems = getExportPathToExportedItems(pathToIndex);
        _.each(exportedItems, exportName => {
            _.each(innerExportPathToExportedItems, (innerExportItems, innerExportPath) => {
                if (!_.startsWith(innerExportPath, './')) {
                    throw new Error(
                        `GENERATE_UPLOAD_DOCS: WARNING - ${packageName} is exporting on of ${exportedItems} which is 
                        itself exported from an external package. To fix this, export the external dependency directly, 
                        not indirectly through ${exportPath}.`,
                    );
                }
                if (_.includes(innerExportItems, exportName)) {
                    const absoluteSrcPath = path.join(pathIfExists, 'src', `${innerExportPath}.ts`);
                    typeDocSourceIncludes.add(absoluteSrcPath);
                }
            });
        });
        // @0xproject/types & ethereum-types are examples of packages where their index.ts exports types
        // directly, meaning no internal paths will exist to follow. Other packages also have direct exports
        // in their index.ts, so we always add it to the source files passed to TypeDoc
        typeDocSourceIncludes.add(pathToIndex);

        typeDocExtraFileIncludes = [...typeDocExtraFileIncludes, ...Array.from(typeDocSourceIncludes)];
    });

    // Generate Typedoc JSON file
    const jsonFilePath = path.join(pathToPackage, 'generated_docs', 'index.json');
    const projectFiles = typeDocExtraFileIncludes.join(' ');
    const cwd = path.join(constants.monorepoRootPath, 'packages', packageName);
    // HACK: For some reason calling `typedoc` command directly from here, even with `cwd` set to the
    // packages root dir, does not work. It only works when called via a `package.json` script located
    // in the package's root.
    await execAsync(`JSON_FILE_PATH=${jsonFilePath} PROJECT_FILES="${projectFiles}" yarn docs:json`, {
        cwd,
    });

    // For each entry, see if it was exported in index.ts. If not, remove it.
    const typedocOutputString = readFileSync(jsonFilePath).toString();
    const typedocOutput = JSON.parse(typedocOutputString);
    const finalTypeDocOutput = _.clone(typedocOutput);
    _.each(typedocOutput.children, (file, i) => {
        const exportItems = findExportItemsGivenTypedocName(exportPathToExportedItems, packageName, file.name);
        _.each(file.children, (child, j) => {
            if (!_.includes(exportItems, child.name)) {
                delete finalTypeDocOutput.children[i].children[j];
            }
        });
        finalTypeDocOutput.children[i].children = _.compact(finalTypeDocOutput.children[i].children);
    });
    // Write modified TypeDoc JSON, without all the unexported stuff
    writeFileSync(jsonFilePath, JSON.stringify(finalTypeDocOutput, null, 2));

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

function findExportItemsGivenTypedocName(
    exportPathToExportedItems: ExportPathToExportedItems,
    packageName: string,
    typedocName: string,
): string[] {
    const typeDocNameWithoutQuotes = _.replace(typedocName, '"', '');
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
    const matchingSanitizedExportPathIfExists = _.find(sanitizedExportPaths, p => {
        return _.startsWith(typeDocNameWithoutQuotes, p);
    });
    if (_.isUndefined(matchingSanitizedExportPathIfExists)) {
        throw new Error(`Didn't find an exportPath for ${typeDocNameWithoutQuotes}`);
    }
    const matchingExportPath = sanitizedExportPathToExportPath[matchingSanitizedExportPathIfExists];
    return exportPathToExportedItems[matchingExportPath];
}

function getExportPathToExportedItems(pkgPath: string): ExportPathToExportedItems {
    const sourceFile = ts.createSourceFile(
        'indexFile',
        readFileSync(pkgPath).toString(),
        ts.ScriptTarget.ES2017,
        /*setParentNodes */ true,
    );
    const exportPathToExportedItems = _getExportPathToExportedItems(sourceFile);
    return exportPathToExportedItems;
}

function _getExportPathToExportedItems(sf: ts.SourceFile): ExportPathToExportedItems {
    const exportPathToExportedItems: ExportPathToExportedItems = {};
    processNode(sf);

    function processNode(node: ts.Node): void {
        switch (node.kind) {
            case ts.SyntaxKind.ExportDeclaration:
                // console.log(node);
                const exportClause = (node as any).exportClause;
                const pkgName = exportClause.parent.moduleSpecifier.text;
                _.each(exportClause.elements, element => {
                    exportPathToExportedItems[pkgName] = _.isUndefined(exportPathToExportedItems[pkgName])
                        ? [element.name.escapedText]
                        : [...exportPathToExportedItems[pkgName], element.name.escapedText];
                });
                break;

            default:
                // noop
                break;
        }

        ts.forEachChild(node, processNode);
    }
    return exportPathToExportedItems;
}
