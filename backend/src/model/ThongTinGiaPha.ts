export type ThongTinGiaPha = {
    idToTien: string | null;
    soDoiCuaToTien: number;
    tenDongHo: string | null;
    thongTinKhac: string | null;
    type: "phaHe" | "mauHe";
};

export const defaultThongTinGiaPhaValue: ThongTinGiaPha = {
    idToTien: null,
    soDoiCuaToTien: 1,
    tenDongHo: null,
    thongTinKhac: null,
    type: "phaHe"
};
