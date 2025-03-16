import { IDAO } from "../../model/IDAO";
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
    } & (Model[key] extends number | string | boolean ? { allowNull: false } | { primaryKey: true } : {}));
};
type Triple = [subject: string, predicate: string, object: string];

export class TableSchema<Model extends ValidModel> {
    private static allSchemas: TableSchema<any>[] = [];
    private static initialTriples: Triple[] = [];

    private static synced = false;
    private static syncing = false;

    static sync() {
        if (TableSchema.synced) return Promise.resolve();

        if (!TableSchema.syncing) {
            TableSchema.syncing = true;

            Fuseki.execPostQuery(`
                INSERT DATA {
                    ${TableSchema.initialTriples.map(t => t.join(" ")).join(" .\n")}
                }
            `).then(() => {
                TableSchema.syncing = false;
                TableSchema.synced = true;
            });
        }

        return new Promise<void>((resolve, reject) => {
            let count = 0;
    
            function check() {
                if (TableSchema.synced) resolve();
    
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

    static getBaseUrl(schemaName: string) {
        return `http://qlgp/${schemaName}#`;
    }

    readonly __type__: "TableSchema";
    readonly name: string;
    readonly fields: TableSchemaFieldDefs<Model>;
    readonly primaryKey: Key<Model>;
    readonly allFields: Key<Model>[];
    readonly urlBase: string;

    constructor({
        name,
        fields
    }: {
        name: string,
        fields: TableSchemaFieldDefs<Model>
    }) {
        this.__type__ = "TableSchema";
        this.name = name;
        this.urlBase = TableSchema.getBaseUrl(name);
        this.fields = fields;
        this.allFields = Object.keys(fields) as Key<Model>[];

        if (TableSchema.allSchemas.some(schema => schema.name == name)) {
            throw Error("Duplicate schema name: " + name);
        }

        let primaryKeyDefined = false;
        for (let i = 0; i < this.allFields.length; i++) {
            const type = this.fields[this.allFields[i]];
            
            if (
                typeof type == "object" &&
                (!("__type__" in type) || type.__type__ != "TableSchema") &&
                "primaryKey" in type && 
                type.primaryKey === true
            ) {
                if (primaryKeyDefined) {
                    throw Error(`Schema ${this.name} has more than one primary key, the second this "${this.allFields[i]}"`);
                }

                if (type.type != "string" && !(type.type instanceof TableSchema)) {
                    throw Error(`Field ${this.allFields[i]} of schema ${this.name} is primary key, and it must be "string"`);
                }

                primaryKeyDefined = true;
                this.primaryKey = this.allFields[i];
                break;
            }
        }

        if (!primaryKeyDefined) {
            throw Error(`Missing primary key in schema ${name}`);
        }

        this.primaryKey = this.allFields[0]; // By pass typescript

        this.registerItSelf();
    }

    private registerItSelf() {
        TableSchema.allSchemas.push(this);
        Fuseki.registerPrefix(this.name, this.urlBase);
        TableSchema.initialTriples.push([`:${this.name}`, "a", "owl:Class"]);

        // this.entrieFields().forEach(([field, typeDef]) => {
        //     const type = this.inferType(typeDef);

        //     TableSchema.initialTriples.push(
        //         [`:${this.convertField(field)}`, "a", this.isLiteralType(type) ? "owl:DataProperty" : "owl:ObjectProperty"]
        //     );
        // });
    }

    private entrieFields() {
        return Object.entries(this.fields) as [Key<Model>, TableSchemaFieldDefs<Model>[string]][];
    }

    private entriesPartialModel(obj: Partial<Model>) {
        return Object.entries(obj) as [Key<Model>, string | number | boolean][];
    }

    private keys<T extends Record<string, any>>(obj: T): Extract<keyof T, string>[] {
        return Object.keys(obj) as Extract<keyof T, string>[];
    }

    private inferType(typeDef: TableSchema<any>["fields"][string]): FieldType {
        return typeof typeDef == "object" && "type" in typeDef
        ? typeDef.type
        : typeDef;
    }

    private removeSelfPrefix(s: string) {
        return s.substring(this.urlBase.length);
    }

    private isLiteralType(type: FieldType): type is LiteralType {
        if (typeof type != "string") return false;
        return (ALL_LITERAL_TYPES).includes(type as LiteralType);
    }

    private dataType(type: Extract<FieldType, LiteralType>) {
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
        }
    }

    private getSchemaName(type: Exclude<FieldType, LiteralType>) {
        if (type == "__self__") {
            return this.name;
        }

        const schema = TableSchema.allSchemas.find(schema => schema == type);
        if (schema) {
            return schema.name;
        } else {
            throw Error(`Unknown rdfs:range of type ${type}, schema ${this.name}`);
        }
    }

    private revertValue(value: string, type: Exclude<FieldType, LiteralType>) {
        const schemaName = this.getSchemaName(type);
        return value.substring(TableSchema.getBaseUrl(schemaName).length);
    }

    private filterInvalidProps(obj: Partial<Model>, filterPrimaryKey = false) {
        return Object.entries(obj)
            .filter(([key, value]) => value && (!filterPrimaryKey || key != this.primaryKey))
            .reduce((result, [key, value]) => {
                result[key as keyof Model] = value;
                return result;
            }, {} as Partial<Model>);
    }

    private tripleObjectRepr(field: Key<Model>, value: any) {
        const type = this.inferType(this.fields[field]);
        const escape = (s: string) => s.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");

        return this.isLiteralType(type)
            ? type == "string"
                ? `"${escape(value as string)}"@vi`
                : `"${value}"^^${this.dataType(type)}`
            : `${this.getSchemaName(type)}:${value}`;
    }

    private tripleQueryRepr(triples: Triple[]) {
        return triples.map(t => t.join(" ")).join(" .\n");
    }

    async create(obj: Model) {
        await TableSchema.sync();

        const id = obj[this.primaryKey] as string;
        const data = this.filterInvalidProps(obj, true);

        const triples: Triple[] = [[`${this.name}:${id}`, "a", `:${this.name}`]];
        const primaryKeyType = this.inferType(this.fields[this.primaryKey]);
        if (!this.isLiteralType(primaryKeyType)) {
            triples.push([`${this.name}:${id}`, `${this.name}:${this.primaryKey}`, `${this.getSchemaName(primaryKeyType)}:${id}`]);
        }
        Object.entries(data).forEach(([_key, value]) => {
            const key = _key as Key<Model>;

            triples.push([`${this.name}:${id}`, `${this.name}:${key}`, this.tripleObjectRepr(key, value)]);
        });

        await Fuseki.execPostQuery(`
            INSERT DATA {
                ${this.tripleQueryRepr(triples)}
            }
        `);
    }

    private buildObjects(triples: Triple[]) {
        const constructorMapping: Record<LiteralType, (s: string) => any> = {
            string: s => String(s),
            int: s => parseInt(s),
            decimal: s => Number(s),
            boolean: s => s == "true"
        };

        const objs: Record<string, Model> = {};
        triples.forEach(([s, p, o]) => {
            // p is metadata. For example: rdf:type ("a"), ...
            if (!p.startsWith(this.urlBase)) {
                return;
            }

            const id = this.removeSelfPrefix(s);
            if (!objs[id]) {
                objs[id] = {
                    [this.primaryKey]: id
                } as Model;
            }

            const field = this.removeSelfPrefix(p) as Key<Model>;
            const type = this.inferType(this.fields[field]);

            objs[id][field] = this.isLiteralType(type)
                ? constructorMapping[type](o)
                : this.revertValue(o, type);
        });

        return Object.values(objs);
    }

    async findByPk(pk: string): Promise<Model | null> {
        await TableSchema.sync();

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
        await TableSchema.sync();

        if (match && match[this.primaryKey]) {
            const obj = await this.findByPk(match[this.primaryKey] as string);
            if (!obj) return [];

            const valid = this.entriesPartialModel(match).every(([k, v]) => {
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

        const triples = match ? this.entriesPartialModel(this.filterInvalidProps(match)).map(([k, v]) => {
            return ["?s", `${this.name}:${k}`, this.tripleObjectRepr(k, v)] as Triple;
        }) : [];

        const response = await Fuseki.execSelectQuery<"s">(`
            SELECT ?s
            WHERE {
                ${this.tripleQueryRepr(triples)}
            }
        `);

        return response.results.bindings.map(data => this.removeSelfPrefix(data.s.value));
    }

    async update(data: Partial<Model>, { where }: { where: PartialNonNullable<Model> }) {
        await TableSchema.sync();

        const triples: Triple[] = [];

        const ids = await this.filter(where);
        ids.forEach(id => {
            this.keys(data).forEach(field => {
                if (!data[field]) {
                    return;
                }
                triples.push([`${this.name}:${id}`, `${this.name}:${field}`, this.tripleObjectRepr(field, data[field])]);
            });
        });

        await Fuseki.execPostQuery(`
            DELETE {
                ?s ?p ?o
            }
            
            WHERE {
                ?s ?p ?o .
                FILTER (?s IN (${ids.map(id => `${this.name}:${id}`).join(", ")}))
                FILTER (?p IN (${this.keys(data).map(k => `${this.name}:${k}`).join(", ")}))
            }
        `);

        await Fuseki.execPostQuery(`
            INSERT DATA {
                ${this.tripleQueryRepr(triples)}
            }
        `);
    }

    async count({ where }: { where: PartialNonNullable<Model> }) {
        await TableSchema.sync();
        return (await this.filter(where)).length;
    }

    async findAll(match?: { where: PartialNonNullable<Model> }) {
        await TableSchema.sync();

        const ids = await this.filter(match ? match.where : undefined);
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
        await TableSchema.sync();
        const objs = await this.findAll({ where });
        return objs.length == 0 ? null : objs[0];
    }

    async destroy({ where }: { where: PartialNonNullable<Model> }) {
        await TableSchema.sync();

        const ids = await this.filter(where);
        const idsRepr = ids.map(id => `${this.name}:${id}`).join(", ");

        await Fuseki.execPostQuery(`
            DELETE WHERE {
                ?s ?p ?o .
                FILTER (
                    ?s in (${idsRepr}) ||
                    ?o in (${idsRepr})
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
