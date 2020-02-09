export type PrintNode<T> = (node: T, branch: string) => string;
export type GetChildren<T> = (node: T) => Array<T>;


export class TreeNode<T> {
    public data: T;
    public children: TreeNode<T>[];

    constructor(data: T) {
        this.data = data;
        this.children = [];
    }
}

