import * as ts from "typescript";

import {Reflection, ReflectionKind, ReflectionFlag, ProjectReflection} from "../../models/index";
import {createDeclaration} from "../factories/index";
import {Context} from "../context";
import {convertNode, NodeConveter} from "../convert-node";


export class ModuleConverter implements NodeConveter<ts.ModuleDeclaration>
{
    /**
     * List of supported TypeScript syntax kinds.
     */
    supports:ts.SyntaxKind[] = [
        ts.SyntaxKind.ModuleDeclaration
    ];


    /**
     * Analyze the given module node and create a suitable reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param node     The module node that should be analyzed.
     * @return The resulting reflection or NULL.
     */
    convert(context:Context, node:ts.ModuleDeclaration):Reflection {
        var parent = context.scope;
        var reflection = createDeclaration(context, node, ReflectionKind.Module);

        context.withScope(reflection, () => {
            var opt = context.getCompilerOptions();
            if (parent instanceof ProjectReflection && !context.isDeclaration &&
                (!opt.module || opt.module == ts.ModuleKind.None)) {
                reflection.setFlag(ReflectionFlag.Exported);
            }

            if (node.body) {
                convertNode(context, node.body);
            }
        });

        return reflection;
    }
}
