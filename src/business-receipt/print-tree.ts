import { nodeToString } from '../business-search/searchable-recipe-node';
import { GetChildren, PrintNode } from './type';

function printTree<T>(
  initialTree: T,
  printNode: PrintNode<T>,
  getChildren: GetChildren<T>,
) {
  let content = '';

  function printBranch(tree: any, branch: any) {
    const isGraphHead = branch.length === 0;
    const children = getChildren(tree) || [];

    let branchHead = '';

    if (!isGraphHead) {
      branchHead = children && children.length !== 0 ? '┬ ' : '─ ';
    }

    const toPrint = printNode(tree, `${branch}${branchHead}`);

    if (typeof toPrint === 'string') {
      // add accumulator here
      content += `${branch}${branchHead}${toPrint} \r\n `;
      //console.log(`${branch}${branchHead}${toPrint}`);
    }

    let baseBranch = branch;

    if (!isGraphHead) {
      const isChildOfLastBranch = branch.slice(-2) === '└─';
      baseBranch = branch.slice(0, -2) + (isChildOfLastBranch ? '  ' : '| ');
    }

    const nextBranch = baseBranch + '├─';
    const lastBranch = baseBranch + '└─';

    children.forEach((child, index) => {
      printBranch(
        child,
        children.length - 1 === index ? lastBranch : nextBranch,
      );
    });
  }
  printBranch(initialTree, '');
  return content;
}

export function printRecipeTree(recipeTree) {
  return printTree(recipeTree, nodeToString, node => node.children);
}
