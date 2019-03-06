declare class Revision {
    constructor()

    applyTo(str: string): string

    compose(...revs: Revision[]): Revision

    equals(rev2: Revision): boolean

    getOperations(): (number | string)[]

    insert(str: string): Revision

    remove(count: number): Revision

    retain(count: number): Revision

    reverse(str: string): Revision

    serialize(): string

    static compose(...revs: Revision[]): Revision

    static deserialize(ops: (number | string)[]): Revision

    static getType(op: number | string): string

    static transform(rev1: Revision, rev2: Revision): Revision[]
}
