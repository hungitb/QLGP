export type ThongTinGiaPha = {
    idToTien: string | null;
    tenDongHo: string | null;
    thongTinKhac: string | null;
    type: "phaHe" | "mauHe";
};

export const defaultThongTinGiaPhaValue: ThongTinGiaPha = {
    idToTien: null,
    tenDongHo: null,
    thongTinKhac: null,
    type: "phaHe"
};
