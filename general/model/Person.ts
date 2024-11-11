
enum Gender {
    MALE = "Nam",
    FEMALE = "Nữ"
}

enum LifeStatus {
    ALIVE = "Còn sống",
    DEAD = "Đã mất"
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
