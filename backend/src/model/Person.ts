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
    connectingPath: string[] | null
};

export type PersonHasQuanHeTrucTiep = {
    id: string,
    type: QuanHeTrucTiep
};

export type PersonAdvanceDAO = {
    isPersonBelongToFamily(id: string): Promise<boolean>;
    isPeopleBelongToFamily(ids: string[]): Promise<Record<string, boolean>>;
    getPeopleHasQuanHeTrucTiep(person: Person): Promise<PersonHasQuanHeTrucTiep[]>;
    findDoiThu(person: Person, getMinValue?: boolean): Promise<number | null>;
    findConnectingPath(pDoiDuoi: Person, pDoiTren?: Person): Promise<string[] | null>;
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
    VoChong: { desc: "Vợ chồng", wayOfCalling: (p: Person) => p.gender == "MALE" ? "Chồng" : "Vợ", needMoreDesc: false, closeness: 1 },
    BanDoiDongTinh: { desc: "Bạn đời đồng tính", wayOfCalling: null, needMoreDesc: false, closeness: 1 },
    Bo: { desc: "Bố", wayOfCalling: "Bố", needMoreDesc: false, closeness: 1 },
    Me: { desc: "Mẹ", wayOfCalling: "Mẹ", needMoreDesc: false, closeness: 1 },
    ConTrai: { desc: "Con trai", wayOfCalling: "Con", needMoreDesc: false, closeness: 1 },
    ConGai: { desc: "Con gái", wayOfCalling: "Con", needMoreDesc: false, closeness: 1 },
    AnhTrai: { desc: "Anh trai", wayOfCalling: "Anh", needMoreDesc: false, closeness: 2 },
    EmTrai: { desc: "Em trai", wayOfCalling: "Em", needMoreDesc: false, closeness: 2 },
    ChiGai: { desc: "Chị gái", wayOfCalling: "Chị", needMoreDesc: false, closeness: 2 },
    EmGai: { desc: "Em gái", wayOfCalling: "Em", needMoreDesc: false, closeness: 2 },
    MeKe: { desc: "Mẹ kế", wayOfCalling: "Mẹ", needMoreDesc: true, closeness: 2 },
    EmTraiCuaBo: { desc: "Em trai của bố", wayOfCalling: "Chú", needMoreDesc: true, closeness: 3 },
    EmGaiCuaBo: { desc: "Em gái của bố", wayOfCalling: "Cô", needMoreDesc: true, closeness: 3 },
    ConCuaAnhTrai: { desc: "Con của anh trai", wayOfCalling: null, needMoreDesc: true, closeness: 3 },
    AnhTraiCuaBo: { desc: "Anh trai của bố", wayOfCalling: "Bác", needMoreDesc: true, closeness: 3 },
    ConCuaEmTrai: { desc: "Con của em trai", wayOfCalling: null, needMoreDesc: true, closeness: 3 },
    ChiGaiCuaBo: { desc: "Chị gái của bố", wayOfCalling: "Bác", needMoreDesc: true, closeness: 3 },
    OngNoi: { desc: "Ông nội", wayOfCalling: null, needMoreDesc: false, closeness: 2 },
    BaNoi: { desc: "Bà nội", wayOfCalling: null, needMoreDesc: false, closeness: 2 },
    ChauNoi: { desc: "Cháu nội", wayOfCalling: null, needMoreDesc: false, closeness: 2 },
    OngNgoai: { desc: "Ông ngoại", wayOfCalling: null, needMoreDesc: false, closeness: 2 },
    BaNgoai: { desc: "Bà Ngoại", wayOfCalling: null, needMoreDesc: false, closeness: 2 },
    ChauNgoai: { desc: "Cháu ngoại", wayOfCalling: null, needMoreDesc: false, closeness: 2 },
    ChaKe: { desc: "Cha kế", wayOfCalling: "Bố", needMoreDesc: true, closeness: 2 },
    EmTraiCuaMe: { desc: "Em trai của mẹ", wayOfCalling: "Cậu", needMoreDesc: true, closeness: 3 },
    ConCuaChiGai: { desc: "Con của chị gái", wayOfCalling: null, needMoreDesc: true, closeness: 3 },
    EmGaiCuaMe: { desc: "Em gái của mẹ", wayOfCalling: "Dì", needMoreDesc: true, closeness: 3 },
    AnhTraiCuaMe: { desc: "Anh trai của mẹ", wayOfCalling: "Bác", needMoreDesc: true, closeness: 3 },
    ChiGaiCuaMe: { desc: "Chị gái của mẹ", wayOfCalling: "Bác", needMoreDesc: true, closeness: 3 },
    ConCuaEmGai: { desc: "Con của em gái", wayOfCalling: null, needMoreDesc: true, closeness: 3 },
    AnhRe: { desc: "Anh rể", wayOfCalling: "Anh", needMoreDesc: true, closeness: 3 },
    EmVo: { desc: "Em vợ", wayOfCalling: "Em", needMoreDesc: true, closeness: 3 },
    EmRe: { desc: "Em rể", wayOfCalling: "Em", needMoreDesc: true, closeness: 3 },
    AnhVo: { desc: "Anh vợ", wayOfCalling: "Anh", needMoreDesc: true, closeness: 3 },
    ChiVo: { desc: "Chị vợ", wayOfCalling: "Chị", needMoreDesc: true, closeness: 3 },
    ChiDau: { desc: "Chị dâu", wayOfCalling: "Chị", needMoreDesc: true, closeness: 3 },
    EmChong: { desc: "Em chồng", wayOfCalling: "Em", needMoreDesc: true, closeness: 3 },
    EmDau: { desc: "Em dâu", wayOfCalling: "Em", needMoreDesc: true, closeness: 3 },
    AnhChong: { desc: "Anh chồng", wayOfCalling: "Anh", needMoreDesc: true, closeness: 3 },
    ChiChong: { desc: "Chị chồng", wayOfCalling: "Chị", needMoreDesc: true, closeness: 3 },
    ConDau: { desc: "Con dâu", wayOfCalling: "Con", needMoreDesc: true, closeness: 2 },
    BoChong: { desc: "Bố chồng", wayOfCalling: "Bố", needMoreDesc: true, closeness: 2 },
    MeChong: { desc: "Mẹ chồng", wayOfCalling: "Mẹ", needMoreDesc: true, closeness: 2 },
    ConRe: { desc: "Con rể", wayOfCalling: "Con", needMoreDesc: true, closeness: 2 },
    BoVo: { desc: "Bố vợ", wayOfCalling: "Bố", needMoreDesc: true, closeness: 2 },
    MeVo: { desc: "Mẹ vợ", wayOfCalling: "Mẹ", needMoreDesc: true, closeness: 2 },
    VoCuaAnhTraiCuaBo: { desc: "Vợ của anh trai của bố", wayOfCalling: "Bác", needMoreDesc: true, closeness: 4 },
    ConCuaEmChong: { desc: "Con của em chồng", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    ConCaiCuaBac: { desc: "Con cái của bác", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    ConCuaEmVo: { desc: "Con của em vợ", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    VoCuaEmTraiCuaBo: { desc: "Vợ của em trai của bố", wayOfCalling: "Thím", needMoreDesc: true, closeness: 4 },
    ConCuaAnhChong: { desc: "Con của anh trai của chồng", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    ConCaiCuaChuThim: { desc: "Con cái của chú thím", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    ChongCuaChiGaiCuaBo: { desc: "Chồng của chị gái của bố", wayOfCalling: "Bác", needMoreDesc: true, closeness: 4 },
    ChongCuaEmGaiCuaBo: { desc: "Chồng của em gái của bố", wayOfCalling: "Chú", needMoreDesc: true, closeness: 4 },
    ConCuaAnhVo: { desc: "Con của anh vợ", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    ConCaiCuaCoChu: { desc: "Con cái của cô chú", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    VoCuaAnhTraiCuaMe: { desc: "Vợ của anh trai của mẹ", wayOfCalling: "Bác", needMoreDesc: true, closeness: 4 },
    ChongCuaChiGaiCuaMe: { desc: "Chồng của chị gái của mẹ", wayOfCalling: "Bác", needMoreDesc: true, closeness: 4 },
    VoCuaEmTraiCuaMe: { desc: "Vợ của em trai của mẹ", wayOfCalling: "Mợ", needMoreDesc: true, closeness: 4 },
    ConCuaChiChong: { desc: "Con của chị của chồng", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    ConCaiCuaCauMo: { desc: "Con cái của cậu mợ", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    ChongCuaEmGaiCuaMe: { desc: "Chồng của em gái của mẹ", wayOfCalling: "Chú", needMoreDesc: true, closeness: 4 },
    ConCuaChiVo: { desc: "Con cái của chị của vợ", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    ConCaiCuaChuDi: { desc: "Con cái của chú dì", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    OngCoNoi: { desc: "Ông cố nội", wayOfCalling: null, needMoreDesc: true, closeness: 3 },
    BaCoNoi: { desc: "Bà cố nội", wayOfCalling: null, needMoreDesc: true, closeness: 3 },
    ChatNoi: { desc: "Chắt nội", wayOfCalling: null, needMoreDesc: true, closeness: 3 },
    OngCoNgoai: { desc: "Ông cố ngoại", wayOfCalling: null, needMoreDesc: true, closeness: 3 },
    BaCoNgoai: { desc: "Bà cố ngoại", wayOfCalling: null, needMoreDesc: true, closeness: 3 },
    ChatNgoai: { desc: "Chắt ngoại", wayOfCalling: null, needMoreDesc: true, closeness: 3 },
    OngKyNoi: { desc: "Ông kỵ nội", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    BaKyNoi: { desc: "Bà kỵ nội", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    ChutNoi: { desc: "Chút nội", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    OngKyNgoai: { desc: "Ông kỵ Ngoại", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    BaKyNgoai: { desc: "Bà kỵ ngoại", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
    ChutNgoai: { desc: "Chút ngoại", wayOfCalling: null, needMoreDesc: true, closeness: 4 },
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
    EmRe: ["AnhVo", ["ChiVo"]],
    AnhVo: ["EmRe"],
    ChiVo: ["EmRe"],
    ChiDau: ["EmChong"],
    EmChong: ["ChiDau"],
    EmDau: ["AnhChong", ["ChiChong"]],
    AnhChong: ["EmDau"],
    ChiChong: ["EmDau"],
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
