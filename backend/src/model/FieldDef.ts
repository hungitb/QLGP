import { StdDate } from "../utils/DateUtils";

export const ALL_FIELD_TYPES = ["TEXT", "COMPLEX_TEXT", "DATE", "PERSON_REF", "IMAGE", "CHECKBOX"] as const;
export type FieldType = (typeof ALL_FIELD_TYPES)[number];
export function isFieldType(x: unknown): x is FieldType {
    if (typeof x == "string") {
        return ALL_FIELD_TYPES.includes(x as any);
    }
    return false;
}
export const fieldTypeDisplayText: Record<FieldType, string> = {
    TEXT: "Văn bản",
    COMPLEX_TEXT: "Văn bản dài",
    DATE: "Ngày tháng",
    PERSON_REF: "Người",
    IMAGE: "Ảnh",
    CHECKBOX: "Ô tích"
};

export type FieldDef = {
    id: string;
    name: string;
    description: string;
    type: FieldType;
    isForAll: boolean;
    createdAt: StdDate;
};
