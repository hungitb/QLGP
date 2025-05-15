import { DateStoredDB, StdDate } from "../utils/DateUtils";

export const ALL_GENDERS = ["MALE", "FEMALE"] as const;
export type Gender = (typeof ALL_GENDERS)[number];
export const genderDisplayText: Record<Gender, string> = {
    MALE: "Nam",
    FEMALE: "Nữ"
};

export const ALL_LIFE_STATES = ["ALIVE", "DEAD", "UNKNOWN"] as const;
export type LifeState = (typeof ALL_LIFE_STATES)[number];
export const lifeStateDisplayText: Record<LifeState, string> = {
    ALIVE: "Còn sống",
    DEAD: "Đã mất",
    UNKNOWN: "Không rõ"
};

export type RelationshipAnalysisResult = {
    p1: {
        wayOfCallingTheOther: string | null;
        relationshipWithTheOtherDesc: string | null;
    },
    p2: {
        wayOfCallingTheOther: string | null;
        relationshipWithTheOtherDesc: string | null;
    },
    relationshipDetailDesc: string | null;
};

export type PersonAdvanceDAO = {
    isPersonBelongToFamily(id: string): Promise<boolean>;
    isPeopleBelongToFamily(ids: string[]): Promise<Record<string, boolean>>;
    relationshipAnalysis(p1: Person, p2: Person): Promise<RelationshipAnalysisResult | null>;
};

export type Person = {
    id: string;
    callname: string;
    gender: Gender;
    avatarUrl: string | null;
    birthdate: DateStoredDB | null;
    deathdate: DateStoredDB | null;
    status: LifeState;
    spouseId: string | null;
    fatherId: string | null;
    motherId: string | null;
    createdAt: StdDate;
    youngnessLevel: number;
};

export const ALL_QUAN_HE_TRUC_TIEP_INFO = {
    VoChong: { desc: "Vợ chồng", wayOfCalling: (p: Person) => p.gender == "MALE" ? "Chồng" : "Vợ" },
    BanDoiDongTinh: { desc: "Bạn đời đồng tính", wayOfCalling: null },
    Bo: { desc: "Bố", wayOfCalling: "Bố" },
    Me: { desc: "Mẹ", wayOfCalling: "Mẹ" },
    ConTrai: { desc: "Con trai", wayOfCalling: "Con" },
    ConGai: { desc: "Con gái", wayOfCalling: "Con" },
    AnhTrai: { desc: "Anh Trai", wayOfCalling: "Anh" },
    EmTrai: { desc: "Em trai", wayOfCalling: "Em" },
    ChiGai: { desc: "Chi gái", wayOfCalling: "Chị" },
    EmGai: { desc: "Em gái", wayOfCalling: "Em" },
    MeKe: { desc: "Mẹ kế", wayOfCalling: "Mẹ" },
    EmTraiCuaBo: { desc: "Em trai của bố", wayOfCalling: "Chú" },
    EmGaiCuaBo: { desc: "Em gái của bố", wayOfCalling: "Cô" },
    ConCuaAnhTrai: { desc: "Con của anh trai", wayOfCalling: null },
    AnhTraiCuaBo: { desc: "Anh trai của bố", wayOfCalling: "Bác" },
    ConCuaEmTrai: { desc: "Con của em trai", wayOfCalling: null },
    ChiGaiCuaBo: { desc: "Chị gái của bố", wayOfCalling: "Bác" },
    OngNoi: { desc: "Ông nội", wayOfCalling: null },
    BaNoi: { desc: "Bà nội", wayOfCalling: null },
    ChauNoi: { desc: "Cháu nội", wayOfCalling: null },
    OngNgoai: { desc: "Ông ngoại", wayOfCalling: null },
    BaNgoai: { desc: "Bà Ngoại", wayOfCalling: null },
    ChauNgoai: { desc: "Cháu ngoại", wayOfCalling: null },
    ChaKe: { desc: "Cha kế", wayOfCalling: "Bố" },
    EmTraiCuaMe: { desc: "Em trai của mẹ", wayOfCalling: "Cậu" },
    ConCuaChiGai: { desc: "Con của chị gái", wayOfCalling: null },
    EmGaiCuaMe: { desc: "Em gái của mẹ", wayOfCalling: "Dì" },
    AnhTraiCuaMe: { desc: "Anh trai của mẹ", wayOfCalling: "Bác" },
    ChiGaiCuaMe: { desc: "Chị gái của mẹ", wayOfCalling: "Bác" },
    ConCuaEmGai: { desc: "Con của em gái", wayOfCalling: null },
    AnhRe: { desc: "Anh rể", wayOfCalling: "Anh" },
    EmVo: { desc: "Em vợ", wayOfCalling: "Em" },
    EmRe: { desc: "Em rể", wayOfCalling: "Em" },
    AnhVo: { desc: "Anh vợ", wayOfCalling: "Anh" },
    ChiDau: { desc: "Chị dâu", wayOfCalling: "Chị" },
    EmChong: { desc: "Em chồng", wayOfCalling: "Em" },
    EmDau: { desc: "Em dâu", wayOfCalling: "Em" },
    AnhChong: { desc: "Anh chồng", wayOfCalling: "Anh" },
    ConDau: { desc: "Con dâu", wayOfCalling: "Con" },
    BoChong: { desc: "Bố chồng", wayOfCalling: "Bố" },
    MeChong: { desc: "Mẹ chồng", wayOfCalling: "Mẹ" },
    ConRe: { desc: "Con rể", wayOfCalling: "Con" },
    BoVo: { desc: "Bố vợ", wayOfCalling: "Bố" },
    MeVo: { desc: "Mẹ vợ", wayOfCalling: "Mẹ" },
    VoCuaAnhTraiCuaBo: { desc: "Vợ của anh trai của bố", wayOfCalling: "Bác" },
    ConCuaEmChong: { desc: "Con của em chồng", wayOfCalling: null },
    ConCaiCuaBac: { desc: "Con cái của bác", wayOfCalling: null },
    ConCuaEmVo: { desc: "Con của em vợ", wayOfCalling: null },
    VoCuaEmTraiCuaBo: { desc: "Vợ của em trai của bố", wayOfCalling: "Thím" },
    ConCuaAnhChong: { desc: "Con của anh trai của chồng", wayOfCalling: null },
    ConCaiCuaChuThim: { desc: "Con cái của chú thím", wayOfCalling: null },
    ChongCuaChiGaiCuaBo: { desc: "Chồng của chị gái của bố", wayOfCalling: "Bác" },
    ChongCuaEmGaiCuaBo: { desc: "Chồng của em gái của bố", wayOfCalling: "Chú" },
    ConCuaAnhVo: { desc: "Con của anh vợ", wayOfCalling: null },
    ConCaiCuaCoChu: { desc: "Con cái của cô chú", wayOfCalling: null },
    VoCuaAnhTraiCuaMe: { desc: "Vợ của anh trai của mẹ", wayOfCalling: "Bác" },
    ChongCuaChiGaiCuaMe: { desc: "Chồng của chị gái của mẹ", wayOfCalling: "Bác" },
    VoCuaEmTraiCuaMe: { desc: "Vợ của em trai của mẹ", wayOfCalling: "Mợ" },
    ConCuaChiChong: { desc: "Con của chị của chồng", wayOfCalling: null },
    ConCaiCuaCauMo: { desc: "Con cái của cậu mợ", wayOfCalling: null },
    ChongCuaEmGaiCuaMe: { desc: "Chồng của em gái của mẹ", wayOfCalling: "Chú" },
    ConCuaChiVo: { desc: "Con cái của chị của vợ", wayOfCalling: null },
    ConCaiCuaChuDi: { desc: "Con cái của chú dì", wayOfCalling: null },
    OngCoNoi: { desc: "Ông cố nội", wayOfCalling: null },
    BaCoNoi: { desc: "Bà cố nội", wayOfCalling: null },
    ChatNoi: { desc: "Chắt nội", wayOfCalling: null },
    OngCoNgoai: { desc: "Ông cố ngoại", wayOfCalling: null },
    BaCoNgoai: { desc: "Bà cố ngoại", wayOfCalling: null },
    ChatNgoai: { desc: "Chắt ngoại", wayOfCalling: null },
    OngKyNoi: { desc: "Ông kỵ nội", wayOfCalling: null },
    BaKyNoi: { desc: "Bà kỵ nội", wayOfCalling: null },
    ChutNoi: { desc: "Chút nội", wayOfCalling: null },
    OngKyNgoai: { desc: "Ông kỵ Ngoại", wayOfCalling: null },
    BaKyNgoai: { desc: "Bà kỵ ngoại", wayOfCalling: null },
    ChutNgoai: { desc: "Chút ngoại", wayOfCalling: null },
} as const;

export const OPPOSITE_RELATIONSHIPS: Record<QuanHeTrucTiep, [first: QuanHeTrucTiep, remaining?: QuanHeTrucTiep[]] | undefined> = {
    VoChong: ["VoChong"],
    BanDoiDongTinh: ["BanDoiDongTinh"],
    Bo: ["ConTrai", ["ConGai"]],
    Me: ["ConTrai", ["ConGai"]],
    ConTrai: ["Bo", ["Me"]],
    ConGai: ["Bo", ["Me"]],
    AnhTrai: ["EmGai", ["EmTrai"]],
    EmTrai: ["AnhTrai", ["ChiGai"]],
    ChiGai: ["EmGai", ["EmTrai"]],
    EmGai: ["AnhTrai", ["ChiGai"]],
    MeKe: undefined,
    EmTraiCuaBo: ["ConCuaAnhTrai"],
    EmGaiCuaBo: ["ConCuaAnhTrai"],
    ConCuaAnhTrai: ["EmTraiCuaBo", ["EmGaiCuaBo"]],
    AnhTraiCuaBo: ["ConCuaEmTrai"],
    ChiGaiCuaBo: ["ConCuaEmTrai"],
    ConCuaEmTrai: ["AnhTraiCuaBo", ["ChiGaiCuaBo"]],
    OngNoi: ["ChauNoi"],
    BaNoi: ["ChauNoi"],
    ChauNoi: ["OngNoi", ["BaNoi"]],
    OngNgoai: ["ChauNgoai"],
    BaNgoai: ["ChauNgoai"],
    ChauNgoai: ["OngNgoai", ["BaNgoai"]],
    ChaKe: undefined,
    EmTraiCuaMe: ["ConCuaChiGai"],
    EmGaiCuaMe: ["ConCuaChiGai"],
    ConCuaChiGai: ["EmTraiCuaMe", ["EmGaiCuaMe"]],
    AnhTraiCuaMe: ["ConCuaEmGai"],
    ChiGaiCuaMe: ["ConCuaEmGai"],
    ConCuaEmGai: ["AnhTraiCuaMe", ["ChiGaiCuaMe"]],
    AnhRe: ["EmVo"],
    EmVo: ["AnhRe"],
    EmRe: ["AnhVo"],
    AnhVo: ["EmRe"],
    ChiDau: ["EmChong"],
    EmChong: ["ChiDau"],
    EmDau: ["AnhChong"],
    AnhChong: ["EmDau"],
    ConDau: ["BoChong", ["MeChong"]],
    BoChong: ["ConDau"],
    MeChong: ["ConDau"],
    ConRe: ["BoVo", ["MeVo"]],
    BoVo: ["ConRe"],
    MeVo: ["ConRe"],
    VoCuaAnhTraiCuaBo: ["ConCuaEmChong"],
    ConCuaEmChong: ["VoCuaAnhTraiCuaBo", ["VoCuaAnhTraiCuaMe"]],
    ConCaiCuaBac: ["ConCaiCuaChuDi", ["ConCaiCuaChuThim", "ConCaiCuaCauMo", "ConCaiCuaCoChu"]],
    ConCuaEmVo: ["ChongCuaChiGaiCuaMe", ["ChongCuaChiGaiCuaBo"]],
    VoCuaEmTraiCuaBo: ["ConCuaAnhChong"],
    ConCuaAnhChong: ["VoCuaEmTraiCuaBo"],
    ConCaiCuaChuThim: ["ConCaiCuaBac"],
    ChongCuaChiGaiCuaBo: ["ConCuaEmVo"],
    ChongCuaEmGaiCuaBo: ["ConCuaAnhVo"],
    ConCuaAnhVo: ["ChongCuaEmGaiCuaBo"],
    ConCaiCuaCoChu: ["ConCaiCuaBac"],
    VoCuaAnhTraiCuaMe: ["ConCuaEmChong"],
    ChongCuaChiGaiCuaMe: ["ConCuaEmVo"],
    VoCuaEmTraiCuaMe: ["ConCuaChiChong"],
    ConCuaChiChong: ["VoCuaEmTraiCuaBo", ["VoCuaEmTraiCuaMe"]],
    ConCaiCuaCauMo: ["ConCaiCuaBac"],
    ChongCuaEmGaiCuaMe: ["ConCuaChiVo"],
    ConCuaChiVo: ["ChongCuaEmGaiCuaMe"],
    ConCaiCuaChuDi: ["ConCaiCuaBac"],
    OngCoNoi: ["ChatNoi"],
    BaCoNoi: ["ChatNoi"],
    ChatNoi: ["OngCoNoi", ["BaCoNoi"]],
    OngCoNgoai: ["ChatNgoai"],
    BaCoNgoai: ["ChatNgoai"],
    ChatNgoai: ["OngCoNgoai", ["BaCoNgoai"]],
    OngKyNoi: ["ChutNoi"],
    BaKyNoi: ["ChutNoi"],
    ChutNoi: ["OngKyNoi", ["BaKyNoi"]],
    OngKyNgoai: ["ChutNgoai"],
    BaKyNgoai: ["ChutNgoai"],
    ChutNgoai: ["OngKyNgoai", ["BaKyNgoai"]]
};

export type QuanHeTrucTiep = keyof typeof ALL_QUAN_HE_TRUC_TIEP_INFO;

export function isQuanHeTrucTiep(x: string): x is QuanHeTrucTiep {
    return Object.keys(ALL_QUAN_HE_TRUC_TIEP_INFO).some(v => v == x);
}

export function relationshipWithDoiTrenDesc(connectingPath: { id: string, gender: Gender }[], isPhaHe: boolean) {
    if (connectingPath.length < 2) {
        throw Error("connectingPath must have at least two people");
    }

    const delta = connectingPath.length - 1;
    if (delta == 1) {
        return connectingPath[1].gender == "MALE" ? "Bố" : "Mẹ";
    }

    const persistantDoiTrenGender = connectingPath.every((p, index, cp) => {
        if (index < 2) return true;
        
        // Bỏ qua giới tính của người cuối cùng vì nó không quan trọng
        // Ví dụ: Mẹ của bố vẫn là bên nội, Mẹ của ông nội vẫn là bên nội
        if (index == cp.length - 1) return true;
        
        return p.gender == cp[1].gender;
    });

    const benNoi = persistantDoiTrenGender && (
        isPhaHe
            ? (connectingPath[1].gender == "MALE")
            : (connectingPath[1].gender == "FEMALE")
    );

    const suffix = benNoi ? " nội" : " ngoại";
    if (delta == 2) {
        return (connectingPath[2].gender == "MALE" ? "Ông" : "Bà") + suffix;
    }
    if (delta == 3) {
        return (connectingPath[3].gender == "MALE" ? "Ông cố" : "Bà cố") + suffix;
    }
    if (delta == 4) {
        return (connectingPath[4].gender == "MALE" ? "Ông kỵ" : "Bà kỵ") + suffix;
    }

    return `Cụ tổ${benNoi ? "" : " bên ngoại"} trực tiếp ở trên ${delta} đời`;
}

export function sortQuanHeByCloseness(x: QuanHeTrucTiep[]) {
    const closenesses: Record<QuanHeTrucTiep, number> = {
        VoChong: 1,
        BanDoiDongTinh: 1,
        Bo: 1,
        Me: 1,
        ConTrai: 1,
        ConGai: 1,
        AnhTrai: 2,
        EmTrai: 2,
        ChiGai: 2,
        EmGai: 2,
        MeKe: 2,
        EmTraiCuaBo: 3,
        EmGaiCuaBo: 3,
        ConCuaAnhTrai: 3,
        AnhTraiCuaBo: 3,
        ChiGaiCuaBo: 3,
        ConCuaEmTrai: 3,
        OngNoi: 2,
        BaNoi: 2,
        ChauNoi: 2,
        OngNgoai: 2,
        BaNgoai: 2,
        ChauNgoai: 2,
        ChaKe: 2,
        EmTraiCuaMe: 3,
        EmGaiCuaMe: 3,
        ConCuaChiGai: 3,
        AnhTraiCuaMe: 3,
        ChiGaiCuaMe: 3,
        ConCuaEmGai: 3,
        AnhRe: 3,
        EmVo: 3,
        EmRe: 3,
        AnhVo: 3,
        ChiDau: 3,
        EmChong: 3,
        EmDau: 3,
        AnhChong: 3,
        ConDau: 2,
        BoChong: 2,
        MeChong: 2,
        ConRe: 2,
        BoVo: 2,
        MeVo: 2,
        VoCuaAnhTraiCuaBo: 4,
        ConCuaEmChong: 4,
        ConCaiCuaBac: 4,
        ConCuaEmVo: 4,
        VoCuaEmTraiCuaBo: 4,
        ConCuaAnhChong: 4,
        ConCaiCuaChuThim: 4,
        ChongCuaChiGaiCuaBo: 4,
        ChongCuaEmGaiCuaBo: 4,
        ConCuaAnhVo: 4,
        ConCaiCuaCoChu: 4,
        VoCuaAnhTraiCuaMe: 4,
        ChongCuaChiGaiCuaMe: 4,
        VoCuaEmTraiCuaMe: 4,
        ConCuaChiChong: 4,
        ConCaiCuaCauMo: 4,
        ChongCuaEmGaiCuaMe: 4,
        ConCuaChiVo: 4,
        ConCaiCuaChuDi: 4,
        OngCoNoi: 3,
        BaCoNoi: 3,
        ChatNoi: 3,
        OngCoNgoai: 3,
        BaCoNgoai: 3,
        ChatNgoai: 3,
        OngKyNoi: 4,
        BaKyNoi: 4,
        ChutNoi: 4,
        OngKyNgoai: 4,
        BaKyNgoai: 4,
        ChutNgoai: 4
    };

    return [...x].sort((a, b) => closenesses[a] - closenesses[b]);
}
