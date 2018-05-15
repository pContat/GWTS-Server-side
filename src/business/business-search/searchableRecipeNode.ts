// transform treeNodeToSearchableTreeNode
import {TreeNode} from "../../lib";
import {Ingredient} from "../../model";


export class SearchableRecipeNode<Ingredient> extends TreeNode<Ingredient> {
  public parent: SearchableRecipeNode<Ingredient> | undefined;
  public nodeBuyPrice: number;

  constructor(rootTreeNode: TreeNode<Ingredient>, parent: SearchableRecipeNode<Ingredient> | undefined = undefined) {
    super(rootTreeNode.data);
    this.nodeBuyPrice = 0;
    this.parent = parent;
    this.children = rootTreeNode.children.map((childTreeNode) => new SearchableRecipeNode<Ingredient>(childTreeNode, this))
  }

  // WTF TYPESCRIPT
  /*  toString() {
      return `${this.data.item_id} (${this.nodeBuyPrice} X ${this.data.count} )`
    }*/


}

export function nodeToString(node: SearchableRecipeNode<Ingredient>): string {
  return `${node.data.item_id } (${node.nodeBuyPrice} X ${node.data.count})`
}
