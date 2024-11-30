
export enum EventTargetType {
    ALL = "ALL",
    SPECIFIC_PEOPLE = "SPECIFIC_PEOPLE",
    PEOPLE_IN_FAMILY_TREE_LEVEL_TWO = "PEOPLE_IN_FAMILY_TREE_LEVEL_TWO",
    PEOPLE_IN_FAMILY_TREE_LEVEL_THREE = "PEOPLE_IN_FAMILY_TREE_LEVEL_THREE",
}

export enum EventType {
    BIRTHDATE = "BIRTHDATE",
    BIRTHDAY = "BIRTHDAY",
    DEATHDATE = "DEATHDATE",
    DEATHDAY = "DEATHDAY",
}

export interface EventSetting {
    userId: string;

    targetType: EventTargetType;
    types: string;

    specificPersonIds: string;
    numGenerationsAbove: number;
    numGenerationsBelow: number;
    includePeopleEqualGeneration: boolean;
}
