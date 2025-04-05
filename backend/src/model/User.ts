
export type ThongTinGiaPha = {
    idToTien: string | null;
    tenDongHo: string | null;
    thongTinKhac: string;
    type: "phaHe" | "mauHe";
};

export type User = {
    id: string;
    username:  string;
    password: string;
    sessionToken: string | null;
    sessionExpiry: number | null;
    permission: "admin" | "read" | "write";
    note: string;
};
