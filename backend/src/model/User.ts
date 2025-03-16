
export type User = {
    id: string
    username:  string
    password: string
    sessionToken: string | null
    sessionExpiry: number | null
};
