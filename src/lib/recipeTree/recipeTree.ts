export class TreeNode<T> {
  public data: T;
  public children: TreeNode<T>[];

  constructor(data: T) {
    this.data = data;
    this.children = [];
  }
}


