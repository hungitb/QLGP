
type Reduced<K> = { [attr in keyof K]?: K[attr] }
type Where<K> = { [attr in keyof K]?: K[attr] }

interface IDAO<K> {
    findByPk: (pk: string) => Promise<K | null>;
    findOne: ({ where }: { where: Where<K> }) => Promise<K | null>;
    findAll: ({ where }?: { where: Where<K> }) => Promise<K[]>;
    count: ({ where }: { where: Where<K> }) => Promise<number>;
    create: (k: K) => any;
    destroy: ({ where }: { where: Where<K> }) => any;
    update: (data: Reduced<K>, { where }: { where: Where<K> }) => any;

    // Frontend wothout backend mode;
    refeshData?: () => any;
}

export type { IDAO }
