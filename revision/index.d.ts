export { Revision };

declare class Revision {
    constructor()

    applyTo(str: string): string

    insert(str: string): Revision

    remove(count: number): Revision

    retain(count: number): Revision

    reverse(str: string): Revision

    compose(...revs: Revision[]): Revision

    static compose(...revs: Revision[]): Revision

    static transform(revA: Revision, revB: Revision): Revision[]

    toOps(): (number | string)[]

    static fromOps(ops: (number | string)[]): Revision

    serialize(): string

    static deserialize(ops: (number | string)[]): Revision

    equals(revB: Revision): boolean

    static getType(op: number | string): string


}
