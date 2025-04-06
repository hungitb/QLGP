
export type CheDoGiaPha = "phaHe" | "mauHe";

export type ThongTinGiaPha = {
    idToTien: string | null;
    soDoiCuaToTien: number;
    tenDongHo: string | null;
    thongTinKhac: string;
    type: CheDoGiaPha;
};

export const getDefaultThongTinGiaPhaValue = (): ThongTinGiaPha => {
    return {
        idToTien: null,
        soDoiCuaToTien: 1,
        tenDongHo: null,
        thongTinKhac: "",
        type: "phaHe"
    };
};
