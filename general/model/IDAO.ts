
type Reduced<K> = { [attr in keyof K]?: K[attr] }
type Where<K> = { [attr in keyof K]?: K[attr] }

interface IDAO<K> {
    findByPk: (pk: string) => Promise<K | undefined | null>;
    findOne: () => Promise<K | undefined | null>;
    findAll: ({ where }: { where: Where<K> }) => Promise<K[]>;
    count: () => Promise<number>;
    create: (k: K) => any;
    destroy: ({ where }: { where: Where<K> }) => any;
    update: (data: Reduced<K>, { where }: { where: Where<K> }) => any;
}

export type { IDAO }
