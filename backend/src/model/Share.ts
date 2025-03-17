export type Share = {
    id: string;
    from: string;
    to: string;
    perm: "read" | "write";
};
