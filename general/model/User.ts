
interface User {
    userId: string
    username:  string
    password: string
    sessionToken: string | null
    sessionExpiry: number | null
}

export type { User }
