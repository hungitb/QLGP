
type Reduced<K> = { [attr in keyof K]?: K[attr] }
type Where<K> = { [attr in keyof K]?: K[attr] }

interface IDAO<K> {
    findByPk: () => Promise<K | undefined>;
    findOne: () => Promise<K | undefined>;
    findAll: ({ where }: { where: Where<K> }) => Promise<K[]>;
    count: () => Promise<number>;
    create: () => any;
    destroy: ({ where }: { where: Where<K> }) => any;
    update: (data: Reduced<K>, { where }: { where: Where<K> }) => any;
}

export type { IDAO }
