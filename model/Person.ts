
enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE"
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

    spouseId?: string
    fatherId?: string
    motherId?: string
}

export { Gender }
export type { Person }
