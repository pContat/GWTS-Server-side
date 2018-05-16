// transform treeNodeToSearchableTreeNode
import {TreeNode} from "../../lib";
import {BuyableIngredient} from "./recipeFinder";


export class SearchableRecipeNode<BuyableIngredient> extends TreeNode<BuyableIngredient> {
  public parent: SearchableRecipeNode<BuyableIngredient> | undefined;


  constructor(rootTreeNode: TreeNode<BuyableIngredient>, parent: SearchableRecipeNode<BuyableIngredient> | undefined = undefined) {
    super(rootTreeNode.data);
    this.parent = parent;
    this.children = rootTreeNode.children.map((childTreeNode) => new SearchableRecipeNode<BuyableIngredient>(childTreeNode, this))
  }

  // WTF TYPESCRIPT
  /*  toString() {
      return `${this.data.item_id} (${this.nodeBuyPrice} X ${this.data.count} )`
    }*/


}

export function nodeToString(node: SearchableRecipeNode<BuyableIngredient>): string {
  return `${node.data.item_id } (${node.data.buyPrice} X ${node.data.count})`
}
