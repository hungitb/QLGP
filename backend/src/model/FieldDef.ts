
export enum FieldType {
    TEXT = "TEXT",
    DATE = "DATE",
    PERSON_REF = "PERSON_REF",
    IMAGE = "IMAGE",
    CHECKBOX = "CHECKBOX"
};

export enum CheckboxTypeValue {
    CHECKED = "CHECKED",
    UNCHECK = "UNCHECK"
};

export type FieldDef = {
    id: string
    ownerUserId: string

    name: string
    description: string
    type: FieldType
    isMultiValue: boolean
    isForAll: boolean
};
