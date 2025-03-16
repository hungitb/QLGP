
type Reduced<K> = { [attr in keyof K]?: K[attr] };
type Where<K> = { [attr in keyof K]?: NonNullable<K[attr]> };

export interface IDAO<K> {
    findByPk: (pk: string) => Promise<K | null>;
    findOne: ({ where }: { where: Where<K> }) => Promise<K | null>;
    findAll: (match?: { where: Where<K> }) => Promise<K[]>;
    count: ({ where }: { where: Where<K> }) => Promise<number>;
    create: (k: K) => Promise<any>;
    destroy: ({ where }: { where: Where<K> }) => Promise<any>;
    update: (data: Reduced<K>, { where }: { where: Where<K> }) => Promise<any>;
};
