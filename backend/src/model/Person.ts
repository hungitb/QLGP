import { DateStoredDB, StdDate } from "../utils/DateUtils";

export enum Gender {
    MALE = "Nam",
    FEMALE = "Nữ"
};

export enum LifeStatus {
    ALIVE = "Còn sống",
    DEAD = "Đã mất"
};

export type PersonAdvanceDAO = {
    isPersonBelongToFamily(id: string): Promise<boolean>;
    isPeopleBelongToFamily(ids: string[]): Promise<Record<string, boolean>>;
};

export type Person = {
    id: string;
    callname: string;
    gender: Gender;
    avatarUrl: string | null;
    birthdate: DateStoredDB | null;
    deathdate: DateStoredDB | null;
    status: LifeStatus | null;
    spouseId: string | null;
    fatherId: string | null;
    motherId: string | null;
    createdAt: StdDate;
    youngnessLevel: number;
};

export const ALL_QUAN_HE_TRUC_TIEP_INFO = {
    VoChong: ["Vợ chồng", p => p.gender == Gender.MALE ? "Chồng" : "Vợ"],
    BanDoiDongTinh: ["Bạn đời đồng tính"],
    Bo: ["Bố", "Bố"],
    Me: ["Mẹ", "Mẹ"],
    ConTrai: ["Con trai", "Con"],
    ConGai: ["Con gái", "Con"],
    AnhTrai: ["Anh Trai", "Anh"],
    EmTrai: ["Em trai", "Em"],
    ChiGai: ["Chi gái", "Chị"],
    EmGai: ["Em gái", "Em"],
    MeKe: ["Mẹ kế", "Mẹ"],
    EmTraiCuaBo: ["Em trai của bố", "Chú"],
    EmGaiCuaBo: ["Em gái của bố", "Cô"],
    ConCuaAnhTrai: ["Con của anh trai"],
    AnhTraiCuaBo: ["Anh trai của bố", "Bác"],
    ConCuaEmTrai: ["Con của em trai"],
    ChiGaiCuaBo: ["Chị gái của bố", "Bác"],
    OngNoi: ["Ông nội"],
    BaNoi: ["Bà nội"],
    ChauNoi: ["Cháu nội"],
    OngNgoai: ["Ông ngoại"],
    BaNgoai: ["Bà Ngoại"],
    ChauNgoai: ["Cháu ngoại"],
    ChaKe: ["Cha kế", "Bố"],
    EmTraiCuaMe: ["Em trai của mẹ", "Cậu"],
    ConCuaChiGai: ["Con của chị gái"],
    EmGaiCuaMe: ["Em gái của mẹ", "Dì"],
    AnhTraiCuaMe: ["Anh trai của mẹ", "Bác"],
    ChiGaiCuaMe: ["Chị gái của mẹ", "Bác"],
    ConCuaEmGai: ["Con của em gái"],
    AnhRe: ["Anh rể", "Anh"],
    EmVo: ["Em vợ", "Em"],
    EmRe: ["Em rể", "Em"],
    AnhVo: ["Anh vợ", "Anh"],
    ChiDau: ["Chị dâu", "Chị"],
    EmChong: ["Em chồng", "Em"],
    EmDau: ["Em dâu", "Em"],
    AnhChong: ["Anh chồng", "Anh"],
    ConDau: ["Con dâu", "Con"],
    BoChong: ["Bố chồng", "Bố"],
    MeChong: ["Mẹ chồng", "Mẹ"],
    ConRe: ["Con rể", "Con"],
    BoVo: ["Bố vợ", "Bố"],
    MeVo: ["Mẹ vợ", "Mẹ"],
    VoCuaAnhTraiCuaBo: ["Vợ của anh trai của bố"],
    ConCuaEmChong: ["Con của em chồng"],
    ConCaiCuaBac: ["Con cái của bác"],
    ConCuaEmVo: ["Con của em vợ"],
    VoCuaEmTraiCuaBo: ["Vợ của em trai của bố"],
    ConCuaAnhChong: ["Con của anh trai của chồng"],
    ConCaiCuaChuThim: ["Con cái của chú thím"],
    ChongCuaChiGaiCuaBo: ["Chồng của chị gái của bố"],
    ChongCuaEmGaiCuaBo: ["Chồng của em gái của bố"],
    ConCuaAnhVo: ["Con của anh vợ"],
    ConCaiCuaCoChu: ["Con cái của cô chú"],
    VoCuaAnhTraiCuaMe: ["Vợ của anh trai của mẹ"],
    ChongCuaChiGaiCuaMe: ["Chồng của chị gái của mẹ"],
    VoCuaEmTraiCuaMe: ["Vợ của em trai của mẹ"],
    ConCuaChiChong: ["Con của chị của chồng"],
    ConCaiCuaCauMo: ["Con cái của cậu mợ"],
    ChongCuaEmGaiCuaMe: ["Chồng của em gái của mẹ"],
    ConCuaChiVo: ["Con cái của chị của vợ"],
    ConCaiCuaChuDi: ["Con cái của chú dì"],
    OngCoNoi: ["Ông cố nội"],
    BaCoNoi: ["Bà cố nội"],
    ChatNoi: ["Chắt nội"],
    OngCoNgoai: ["Ông cố ngoại"],
    BaCoNgoai: ["Bà cố ngoại"],
    ChatNgoai: ["Chắt ngoại"],
    OngKyNoi: ["Ông kỵ nội"],
    BaKyNoi: ["Bà kỵ nội"],
    ChutNoi: ["Chút nội"],
    OngKyNgoai: ["Ông kỵ Ngoại"],
    BaKyNgoai: ["Bà kỵ ngoại"],
    ChutNgoai: ["Chút ngoại"]
} as const satisfies Record<string, [
    desc: string,
    wayOfCalling?: string | ((target: Person) => string),
]>;

export const OPPOSITE_RELATIONSHIPS: Record<QuanHeTrucTiep, [QuanHeTrucTiep, remaining?: QuanHeTrucTiep[]] | undefined> = {
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

const HAS_EQUIVALINT_INDIRECTLY_RELATIONSHIP = [
    "EmTraiCuaBo", "EmGaiCuaBo", "AnhTraiCuaBo", "ChiGaiCuaBo",
    "EmTraiCuaMe", "EmGaiCuaMe", "AnhTraiCuaMe", "ChiGaiCuaMe"
] as const satisfies QuanHeTrucTiep[];

export type QuanHeTrucTiepHasEquivalintGianTiep = (typeof HAS_EQUIVALINT_INDIRECTLY_RELATIONSHIP)[number];

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
        return connectingPath[1].gender == Gender.MALE ? "Bố" : "Mẹ";
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
            ? (connectingPath[1].gender == Gender.MALE)
            : (connectingPath[1].gender == Gender.FEMALE)
    );

    const suffix = benNoi ? " nội" : " ngoại";
    if (delta == 2) {
        return (connectingPath[2].gender == Gender.MALE ? "Ông" : "Bà") + suffix;
    }
    if (delta == 3) {
        return (connectingPath[3].gender == Gender.MALE ? "Ông cố" : "Bà cố") + suffix;
    }
    if (delta == 4) {
        return (connectingPath[4].gender == Gender.MALE ? "Ông kỵ" : "Bà kỵ") + suffix;
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
