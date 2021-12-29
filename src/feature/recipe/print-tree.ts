import { isNil } from 'lodash';
import { SearchableRecipeNode } from '../business-search/searchable-recipe-node';
import {
  CANT_BUY,
  MISSING_INGREDIENT,
  DONT_CRAFT,
} from '../business-search/service/const';
import { BuyableIngredient } from '../business-search/type';
import { GetChildren, PrintNode } from './type/tree-node';

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

export function nodeToString(
  node: SearchableRecipeNode<BuyableIngredient>,
): string {
  const buyPrice = node.data.originalBuyPrice
    ? node.data.originalBuyPrice
    : node.data.buyPrice;
  let craft =
    node.data.craftPrice === MISSING_INGREDIENT ||
    node.data.craftPrice === CANT_BUY ||
    isNil(node.data.craftPrice)
      ? 'KO'
      : node.data.craftPrice;
  if (node.data.craftPrice === DONT_CRAFT) {
    craft = 'Not Worse';
  }

  return `${node.data.itemId} X ${node.data.count} (buy : ${buyPrice} | craft : ${craft}})`;
}
