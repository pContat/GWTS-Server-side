// transform treeNodeToSearchableTreeNode
import { isNil } from 'lodash';
import { TreeNode } from '../recipe/type/tree-node';
import { CANT_BUY, CANT_CRAFT, DONT_CRAFT } from './service/const';
import { BuyableIngredient } from './type';

export class SearchableRecipeNode<T> extends TreeNode<T> {
  public parent: SearchableRecipeNode<T> | undefined;
  public children: SearchableRecipeNode<T>[];

  constructor(
    rootTreeNode: TreeNode<T>,
    parent: SearchableRecipeNode<T> | undefined = undefined,
  ) {
    super(rootTreeNode.data);
    this.parent = parent;
    this.children = rootTreeNode.children.map(
      childTreeNode => new SearchableRecipeNode<T>(childTreeNode, this),
    );
  }

  // WTF TYPESCRIPT
  toString() {
    return this.data.toString();
  }
}

export function nodeToString(
  node: SearchableRecipeNode<BuyableIngredient>,
): string {
  const buyPrice = node.data.originalBuyPrice
    ? node.data.originalBuyPrice
    : node.data.buyPrice;
  let craft =
    node.data.craftPrice === CANT_CRAFT ||
    node.data.craftPrice === CANT_BUY ||
    isNil(node.data.craftPrice)
      ? 'KO'
      : node.data.craftPrice;
  if (node.data.craftPrice === DONT_CRAFT) {
    craft = 'Not Worse';
  }

  return `${node.data.itemId} X ${node.data.count} (buy : ${buyPrice} | craft : ${craft}})`;
}
