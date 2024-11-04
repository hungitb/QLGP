
enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE"
}

enum LifeStatus {
    ALIVE = "ALIVE",
    DEAD = "DEAD"
}

interface Person {
    id: string
    ownerUserId: string
    isStandForUser: boolean
    
    callname: string
    gender: Gender
    avatarUrl: string | null
    birthday: string | null
    deathday: string | null
    status: LifeStatus | null
    spouseId: string | null
    fatherId: string | null
    motherId: string | null
}

export { Gender, LifeStatus }
export type { Person }
