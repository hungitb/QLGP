
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
    birthdate: string | null;
    deathdate: string | null;
    status: LifeStatus | null;
    spouseId: string | null;
    fatherId: string | null;
    motherId: string | null;
};
