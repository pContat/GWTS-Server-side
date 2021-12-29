import { TreeNode } from '../recipe/type/tree-node';

/** @description  Tree that allow two way navigation : to children and to parent */
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
