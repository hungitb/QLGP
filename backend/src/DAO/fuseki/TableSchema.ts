import { IDAO, IDASO } from "../../model/IDAO";
import Fuseki from "./Fuseki";

const ALL_LITERAL_TYPES = ["string", "int", "decimal", "boolean"] as const;
type LiteralType = (typeof ALL_LITERAL_TYPES)[number];
type FieldType = "__self__" | LiteralType | TableSchema<any>;
type ValidModel = Record<string, string | boolean | number | null>;
type PartialNonNullable<Model extends ValidModel> = {
    [key in keyof Model]?: NonNullable<Model[key]>
};
type Key<Model extends ValidModel> = Extract<keyof Model, string>;
type TableSchemaFieldDefs<Model extends ValidModel> = {
    [key in keyof Model]: FieldType | ({
        type: FieldType;
        alias?: string;
    } & (Model[key] extends number | string | boolean ? { allowNull: false } | { primaryKey: true } | {} : {}));
};
type Triple = [subject: string, predicate: string, object: string];


const state = {
    allCompleteSchemas: [] as TableSchema<any>[],
    initialTriples: [] as Triple[],
    synced: false,
    syncing: false
};

function syncSchemas() {
    if (state.synced) return Promise.resolve();

    if (!state.syncing) {
        state.syncing = true;

        Fuseki.execPostQuery(`
            INSERT DATA {
                ${state.initialTriples.map(t => t.join(" ")).join(" .\n")}
            }
        `).then(() => {
            state.syncing = false;
            state.synced = true;
        });
    }

    return new Promise<void>((resolve, reject) => {
        let count = 0;
    
        function check() {
            if (state.synced) resolve();
    
            if (count < 10000) {
                count++;
                setTimeout(check, 10);
            }
    
            else {
                reject("Timeout to wait fuseki available!");
            }
        }
        
        check();
    });
}

const constructorMapping: Record<LiteralType, (s: string) => any> = {
    string: s => String(s),
    int: s => parseInt(s),
    decimal: s => Number(s),
    boolean: s => s == "true"
};

const utils = {
    getBaseUrl(schemaName: string) {
        return `http://qlgp/${schemaName}#`;
    },
    entriesFields<Model extends ValidModel>(fields: TableSchemaFieldDefs<Model>) {
        return Object.entries(fields) as [Key<Model>, TableSchemaFieldDefs<Model>[string]][]
    },
    entriesPartialModel<Model extends ValidModel>(obj: Partial<Model>) {
        return Object.entries(obj) as [Key<Model>, string | number | boolean][];
    },
    keys<T extends Record<string, any>>(obj: T): Extract<keyof T, string>[] {
        return Object.keys(obj) as Extract<keyof T, string>[];
    },
    inferType(typeDef: TableSchema<any>["fields"][string]): FieldType {
        return typeof typeDef == "object" && "type" in typeDef
            ? typeDef.type
            : typeDef;
    },
    isLiteralType(type: FieldType): type is LiteralType {
        if (typeof type != "string") return false;
        return (ALL_LITERAL_TYPES).includes(type as LiteralType);
    },
    tripleQueryRepr(triples: Triple[]) {
        return triples.map(t => t.join(" ")).join(" .\n");
    },
    dataType(type: Extract<FieldType, LiteralType>) {
        if (type == "string") {
            return "xsd:string";
        } else if (type == "boolean") {
            return "xsd:boolean";
        } else if (type == "int") {
            return "xsd:int";
        } else if (type == "decimal") {
            return "xsd:decimal";
        } else {
            const x: never = type; // Typescript trick
            throw Error(`Unknown data type of type ${type}`);
        }
    }
};

class BaseTableSchema<Model extends ValidModel> {
    readonly __type__: "TableSchema" = "TableSchema";
    protected readonly name: string;
    protected readonly fields: TableSchemaFieldDefs<Model>;
    protected readonly urlBase: string;
    private readonly fieldMapping: Record<Key<Model>, string> = {} as any;
    private readonly aliasMapping: Record<string, Key<Model>> = {};

    constructor({
        name,
        fields
    }: {
        name: string,
        fields: TableSchemaFieldDefs<Model>
    }) {
        if (state.syncing || state.synced) {
            throw Error("It's too late to create a schema");
        }

        this.name = name;
        this.urlBase = utils.getBaseUrl(name);
        this.fields = fields;

        if (state.allCompleteSchemas.some(schema => schema.name == name)) {
            throw Error("Duplicate schema name: " + name);
        }

        const allFields = utils.keys(fields);
        allFields.forEach(field => {
            const type = fields[field];
            var alias;
            if (
                typeof type == "object" &&
                (!("__type__" in type) || type.__type__ != "TableSchema") &&
                "alias" in type && type.alias
            ) {
                alias = type.alias;
            } else {
                alias = field;
            }

            this.aliasMapping[alias] = field;
            this.fieldMapping[field] = alias;
        });

        Fuseki.registerPrefix(this.name, this.urlBase);
    }

    protected convertModelFieldToFusekiField(field: Key<Model>): string {
        return this.fieldMapping[field];
    }

    protected convertFusekiFieldToModelField(field: string): Key<Model> {
        return this.aliasMapping[field];
    }

    protected removeSelfPrefix(s: string) {
        return s.substring(this.urlBase.length);
    }

    protected getSchemaName(type: Exclude<FieldType, LiteralType>) {
        if (type == "__self__") {
            return this.name;
        }

        const schema = state.allCompleteSchemas.find(schema => schema == type);
        if (schema) {
            return schema.name;
        } else {
            throw Error(`Unknown rdfs:range of type ${type}, schema ${this.name}`);
        }
    }

    protected revertValue(value: string, type: Exclude<FieldType, LiteralType>) {
        const schemaName = this.getSchemaName(type);
        return value.substring(utils.getBaseUrl(schemaName).length);
    }

    protected tripleObjectRepr(field: Key<Model>, value: any) {
        const type = utils.inferType(this.fields[field]);
        const escape = (s: string) => {
            return s
                .replaceAll("\\", "\\\\")
                .replaceAll("\"", "\\\"")
                .replaceAll("\n", "\\n");
        };

        return utils.isLiteralType(type)
            ? type == "string"
                ? `"${escape(value as string)}"@vi`
                : `"${value}"^^${utils.dataType(type)}`
            : `${this.getSchemaName(type)}:${value}`;
    }

    protected addInitTriplesForField(field: Key<Model>, typeDef: TableSchemaFieldDefs<Model>[string]) {
        const type = utils.inferType(typeDef);

        const typeAsSubject = `${this.name}:${this.convertModelFieldToFusekiField(field)}`;

        if (utils.isLiteralType(type)) {
            state.initialTriples.push(
                [typeAsSubject, "a", "owl:DataProperty"],
                [typeAsSubject, "rdfs:domain", `:${this.name}`],
                [typeAsSubject, "rdfs:range", utils.dataType(type)]
            );
        } else {
            state.initialTriples.push(
                [typeAsSubject, "a", "owl:ObjectProperty"],
                [typeAsSubject, "rdfs:domain", `:${this.name}`],
                [typeAsSubject, "rdfs:range", `:${this.getSchemaName(type)}`]
            );
        }
    }

    protected isThisTriplePredicateCanBeUsedToBuildObject(p: string) {
        // p is metadata. For example: rdf:type ("a"), ...
        if (!p.startsWith(this.urlBase)) {
            return false;
        }
        return true;
    }
}

export class TableSchema<Model extends ValidModel> extends BaseTableSchema<Model> {
    readonly primaryKey: Key<Model>;

    constructor({
        name,
        fields
    }: {
        name: string,
        fields: TableSchemaFieldDefs<Model>
    }) {
        const allFields = utils.keys(fields);
        let primaryKey: Key<Model> | undefined = undefined;
        for (let i = 0; i < allFields.length; i++) {
            const type = fields[allFields[i]];
            
            if (
                typeof type == "object" &&
                (!("__type__" in type) || type.__type__ != "TableSchema") &&
                "primaryKey" in type && 
                type.primaryKey === true
            ) {
                if (primaryKey) {
                    throw Error(`Schema ${name} has more than one primary key, the second this "${allFields[i]}"`);
                }

                if (type.type != "string" && !(type.type instanceof TableSchema)) {
                    throw Error(`Field ${allFields[i]} of schema ${name} is primary key, and it must be "string"`);
                }

                if (!(type.type instanceof TableSchema) && "alias" in type) {
                    throw Error(`Does not support alias for primary key ${allFields[i]}, schema ${name}`);
                }

                primaryKey = allFields[i];
                break;
            }
        }

        if (!primaryKey) {
            throw Error(`Missing primary key in schema ${name}`);
        }

        super({ name, fields });

        this.primaryKey = primaryKey;

        state.allCompleteSchemas.push(this);
        state.initialTriples.push([`:${this.name}`, "a", "owl:Class"]);

        utils.entriesFields(this.fields).forEach(([field, typeDef]) => {
            if (field == this.primaryKey) {
                return;
            }

            this.addInitTriplesForField(field, typeDef);
        });
    }

    private filterInvalidProps(obj: Partial<Model>, filterPrimaryKey = false) {
        return Object.entries(obj)
            .filter(([key, value]) => value !== undefined && value !== null && (!filterPrimaryKey || key != this.primaryKey))
            .reduce((result, [key, value]) => {
                result[key as keyof Model] = value;
                return result;
            }, {} as PartialNonNullable<Model>);
    }

    async create(obj: Model) {
        await syncSchemas();

        const id = obj[this.primaryKey] as string;
        const data = this.filterInvalidProps(obj, true);

        const triples: Triple[] = [[`${this.name}:${id}`, "a", `:${this.name}`]];
        const primaryKeyType = utils.inferType(this.fields[this.primaryKey]);
        if (!utils.isLiteralType(primaryKeyType)) {
            triples.push([
                `${this.name}:${id}`,
                `${this.name}:${this.convertModelFieldToFusekiField(this.primaryKey)}`,
                `${this.getSchemaName(primaryKeyType)}:${id}`
            ]);
        }
        Object.entries(data).forEach(([_key, value]) => {
            const key = _key as Key<Model>;

            triples.push([
                `${this.name}:${id}`,
                `${this.name}:${this.convertModelFieldToFusekiField(key)}`,
                this.tripleObjectRepr(key, value)
            ]);
        });

        await Fuseki.execPostQuery(`
            INSERT DATA {
                ${utils.tripleQueryRepr(triples)}
            }
        `);
    }

    private buildObjects(triples: Triple[]) {
        const objs: Record<string, Model> = {};

        triples.forEach(([s, p, o]) => {
            if (!this.isThisTriplePredicateCanBeUsedToBuildObject(p)) {
                return;
            }

            const id = this.removeSelfPrefix(s);
            if (!objs[id]) {
                objs[id] = {
                    [this.primaryKey]: id
                } as Model;
            }

            const field = this.convertFusekiFieldToModelField(this.removeSelfPrefix(p));
            const type = utils.inferType(this.fields[field]);

            objs[id][field] = utils.isLiteralType(type)
                ? constructorMapping[type](o)
                : this.revertValue(o, type);
        });

        return Object.values(objs);
    }

    async findByPk(pk: string): Promise<Model | null> {
        await syncSchemas();

        const response = await Fuseki.execSelectQuery<"p" | "o">(`
            SELECT ?p ?o
            WHERE {
                ${this.name}:${pk} ?p ?o
            }
        `);

        if (response.results.bindings.length == 0) {
            return null;
        }

        const triples = response.results.bindings.map(data => [this.urlBase + pk, data.p.value, data.o.value] as Triple);
        return this.buildObjects(triples)[0];
    }

    private async filter(match?: PartialNonNullable<Model>): Promise<string[]> {
        await syncSchemas();

        if (match && match[this.primaryKey]) {
            const obj = await this.findByPk(match[this.primaryKey] as string);
            if (!obj) return [];

            const valid = utils.entriesPartialModel(match).every(([k, v]) => {
                if (v === undefined) return true;
                if (!v && !obj[k]) return true;
                if (v == obj[k]) return true;
                return false;
            });

            if (valid) {
                return [match[this.primaryKey] as string];
            }

            return [];
        }

        match = this.filterInvalidProps(match || {});

        const triples: Triple[] = (match && Object.keys(match).length > 0)
            ? utils.entriesPartialModel(match).map(([k, v]) => {
                return [
                    "?s",
                    `${this.name}:${this.convertModelFieldToFusekiField(k)}`,
                    this.tripleObjectRepr(k, v)
                ];
            })
            : [];

        const response = await Fuseki.execSelectQuery<"s">(`
            SELECT DISTINCT ?s
            WHERE {
                ?s a :${this.name} .
                ${utils.tripleQueryRepr(triples)}
            }
        `);

        return response.results.bindings.map(data => this.removeSelfPrefix(data.s.value));
    }

    async update(data: Partial<Model>, { where }: { where: PartialNonNullable<Model> }) {
        await syncSchemas();

        const triples: Triple[] = [];

        const ids = await this.filter(where);
        if (ids.length == 0) {
            return;
        }

        const dataValidKeys = utils.keys(data).filter(key => key != this.primaryKey);
        
        ids.forEach(id => {
            dataValidKeys.forEach(field => {
                if (!data[field]) {
                    return;
                }
                triples.push([
                    `${this.name}:${id}`,
                    `${this.name}:${this.convertModelFieldToFusekiField(field)}`,
                    this.tripleObjectRepr(field, data[field])
                ]);
            });
        });

        await Fuseki.execPostQuery(`
            DELETE {
                ?s ?p ?o
            }
            
            WHERE {
                ?s ?p ?o .
                FILTER (?s IN (${ids.map(id => `${this.name}:${id}`).join(", ")}))
                FILTER (?p IN (${
                    dataValidKeys.map(
                        k => `${this.name}:${this.convertModelFieldToFusekiField(k)}`
                    ).join(", ")
                }))
            };

            INSERT DATA {
                ${utils.tripleQueryRepr(triples)}
            }
        `);
    }

    async count({ where }: { where: PartialNonNullable<Model> }) {
        await syncSchemas();
        return (await this.filter(where)).length;
    }

    async findAll(match?: { where: PartialNonNullable<Model> }) {
        await syncSchemas();

        const ids = await this.filter(match ? match.where : undefined);
        if (ids.length == 0) {
            return [];
        }

        const response = await Fuseki.execSelectQuery<"s" | "p" | "o">(`
            SELECT ?s ?p ?o
            WHERE {
                ?s ?p ?o
                FILTER (?s IN (${ids.map(id => `${this.name}:${id}`).join(", ")}))
            }
        `);

        const triples = response.results.bindings.map(data => [data.s.value, data.p.value, data.o.value] as Triple);

        return this.buildObjects(triples);
    }

    async findOne({ where }: { where: PartialNonNullable<Model> }) {
        await syncSchemas();
        const objs = await this.findAll({ where });
        return objs.length == 0 ? null : objs[0];
    }

    async destroy({ where }: { where: PartialNonNullable<Model> }) {
        await syncSchemas();

        const ids = await this.filter(where);
        if (ids.length == 0) {
            return;
        }

        const idsRepr = ids.map(id => `${this.name}:${id}`).join(", ");

        await Fuseki.execPostQuery(`
            DELETE {
                ?s ?p ?o
            }
                
            WHERE {
                ?s ?p ?o .
                FILTER (
                    ?s in (${idsRepr})
                )
            }
        `);
    }

    getDAO(): IDAO<Model> {
        return {
            create: this.create.bind(this),
            update: this.update.bind(this),
            count: this.count.bind(this),
            findByPk: this.findByPk.bind(this),
            findAll: this.findAll.bind(this),
            findOne: this.findOne.bind(this),
            destroy: this.destroy.bind(this)
        };
    }
}

export class TableSchemaSingleRow<Model extends ValidModel> extends BaseTableSchema<Model> {
    private readonly initValue: Model;
    private syncedInitValue = false;
    private readonly specKeyMarkExist = "__inserted__";

    constructor({
        name,
        fields,
        initValue
    }: {
        name: string,
        fields: TableSchemaFieldDefs<Model>,
        initValue: Model
    }) {
        const allFields = utils.keys(fields);
        for (let i = 0; i < allFields.length; i++) {
            const type = fields[allFields[i]];
            
            if (
                typeof type == "object" &&
                (!("__type__" in type) || type.__type__ != "TableSchema") &&
                "primaryKey" in type && 
                type.primaryKey === true
            ) {
                throw Error(`Does not support primary key for TableSchemaSingleRow ${name}`);
            }
        }

        super({ name, fields });

        this.initValue = initValue;

        utils.entriesFields(this.fields).forEach(([field, typeDef]) => {
            this.addInitTriplesForField(field, typeDef);
        });
    }

    private async init() {
        await syncSchemas();

        if (this.syncedInitValue) {
            return;
        }

        const response = await Fuseki.execSelectQuery<"o">(`
            SELECT ?o
            WHERE {
                :${this.name} ${this.name}:${this.specKeyMarkExist} ?o
            }
        `);

        if (response.results.bindings.length > 0) {
            this.syncedInitValue = true;
            return;
        }

        const triples: Triple[] = [];

        Object.entries(this.initValue).forEach(([_key, value]) => {
            if (value === undefined || value === null) return;
            const key = _key as Key<Model>;

            triples.push([
                `:${this.name}`,
                `${this.name}:${this.convertModelFieldToFusekiField(key)}`,
                this.tripleObjectRepr(key, value)
            ]);
        });

        await Fuseki.execPostQuery(`
            INSERT DATA {
                :${this.name} ${this.name}:${this.specKeyMarkExist} "true" .
                ${utils.tripleQueryRepr(triples)}
            }
        `);

        this.syncedInitValue = true;
    }

    async get(): Promise<Model> {
        await this.init();

        const response = await Fuseki.execSelectQuery<"p" | "o">(`
            SELECT ?p ?o
            WHERE {
                :${this.name} ?p ?o
            }
        `);

        const obj: Model = {} as any;
        response.results.bindings.forEach(t => {
            const p = t.p.value;
            const o = t.o.value;

            if (!this.isThisTriplePredicateCanBeUsedToBuildObject(p)) {
                return;
            }

            const fieldFuseki = this.removeSelfPrefix(p);
            if (fieldFuseki == this.specKeyMarkExist) {
                return;
            }

            const field = this.convertFusekiFieldToModelField(fieldFuseki);
            const type = utils.inferType(this.fields[field]);

            obj[field] = utils.isLiteralType(type)
                ? constructorMapping[type](o)
                : this.revertValue(o, type);
        });

        return obj;
    }

    async update(data: Partial<Model>) {
        await this.init();

        const triples: Triple[] = [];
        
        utils.keys(data).forEach(field => {
            if (!data[field]) {
                return;
            }

            triples.push([
                `:${this.name}`,
                `${this.name}:${this.convertModelFieldToFusekiField(field)}`,
                this.tripleObjectRepr(field, data[field])
            ]);
        });

        await Fuseki.execPostQuery(`
            DELETE {
                ?s ?p ?o
            }
            
            WHERE {
                ?s ?p ?o .
                FILTER (?s IN (:${this.name}))
                FILTER (?p IN (${
                    utils.keys(data).map(
                        k => `${this.name}:${this.convertModelFieldToFusekiField(k)}`
                    ).join(", ")
                }))
            };

            INSERT DATA {
                ${utils.tripleQueryRepr(triples)}
            }
        `);
    }

    getDASO(): IDASO<Model> {
        return {
            get: this.get.bind(this),
            update: this.update.bind(this)
        };
    }
}
