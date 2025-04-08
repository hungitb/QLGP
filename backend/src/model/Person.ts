import { DateStoredDB, StdDate } from "../utils/DateUtils";

export enum Gender {
    MALE = "Nam",
    FEMALE = "Nữ"
};

export enum LifeStatus {
    ALIVE = "Còn sống",
    DEAD = "Đã mất"
};

export type Person = {
    id: string;
    callname: string;
    gender: Gender;
    avatarUrl: string | null;
    birthdate: DateStoredDB | null;
    deathdate: DateStoredDB | null;
    status: LifeStatus | null;
    spouseId: string | null;
    fatherId: string | null;
    motherId: string | null;
    createdAt: StdDate;
};

export type PersonFuseki = Person & {
    birthdateHasDayMonthYear: boolean;
    birthdateHasMonthYear: boolean;
    birthdateHasYear: boolean;
    birthdateDayMonthYearRepr: number | null;
    birthdateMonthYearRepr: number | null;
    birthdateYearRepr: number | null;
};
