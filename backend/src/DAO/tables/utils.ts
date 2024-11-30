import { type ModelAttributes, type Model } from "sequelize";

export type SequlizeTableDefineColumns<K> = {
    [column in keyof K]: ModelAttributes<Model<any, any>, any>[any] & (K[column] extends number | string | boolean ? { allowNull: false } | { primaryKey: true } : {});
}