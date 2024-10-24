
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
    avatarUrl?: string
    birthday?: string
    deathday?: string
    status?: LifeStatus
    spouseId?: string
    fatherId?: string
    motherId?: string
}

export { Gender, LifeStatus }
export type { Person }
