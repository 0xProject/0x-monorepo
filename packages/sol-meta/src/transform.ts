import { ASTNode } from 'solidity-parser-antlr';

const visitor = {
    
    // If a function is not public, add a wrapper to make it public
    FunctionDefinition: func =>
        func.visbility,

}

export function transform(ast: ASTNode): ASTNode {
    return (visitor[ast.type] || (a => a))(ast);
}
