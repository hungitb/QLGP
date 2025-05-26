import { User } from "../../model/User";
import {
    ALL_QUAN_HE_TRUC_TIEP_INFO,
    Gender,
    isQuanHeTrucTiep,
    OPPOSITE_RELATIONSHIPS,
    Person,
    PersonAdvanceDAO,
    QuanHeTrucTiep,
    relationshipWithDoiTrenDesc,
    sortQuanHeByCloseness,
    RelationshipAnalysisResult
} from "../../model/Person";
import { FieldDef } from "../../model/FieldDef";
import { FieldVal } from "../../model/FieldVal";
import { TableSchema, TableSchemaSingleRow } from "./TableSchema";
import { getDefaultThongTinGiaPhaValue, ThongTinGiaPha } from "../../model/ThongTinGiaPha";
import Fuseki from "./Fuseki";

const userSchema = new TableSchema<User>({
    name: "user",
    fields: {
        id: {
            type: "string",
            primaryKey: true
        },
        username: {
            type: "string",
            allowNull: false
        },
        password: {
            type: "string",
            allowNull: false
        },
        sessionToken: {
            type: "string"
        },
        sessionExpiry: {
            type: "integer"
        },
        permission: {
            type: "string",
            allowNull: false
        },
        note: {
            type: "string",
            allowNull: false
        },
        createdAt: "date"
    }
});

const personSchema = new TableSchema<Person>({
    name: "person",
    fields: {
        id: {
            type: "string",
            primaryKey: true
        },
        callname: {
            type: "string",
            allowNull: false,
            alias: "name"
        },
        gender: {
            type: "string",
            allowNull: false
        },
        avatarUrl: "string",
        birthdate: "string",
        status: "string",
        deathdate: "string",
        spouseId: {
            type: "__self__",
            alias: "hasSpouse"
        },
        fatherId: {
            type: "__self__",
            alias: "hasFather"
        },
        motherId: {
            type: "__self__",
            alias: "hasMother"
        },
        createdAt: "date",
        youngnessLevel: "integer"
    }
});

const fieldDefSchema = new TableSchema<FieldDef>({
    name: "fieldDef",
    fields: {
        id: {
            type: "string",
            primaryKey: true
        },
        name: "string",
        description: "string",
        type: "string",
        isForAll: "boolean"
    }
});

const fieldValSchema = new TableSchema<FieldVal>({
    name: "fieldVal",
    fields: {
        id: {
            type: "string",
            primaryKey: true
        },
        personId: personSchema,
        fieldDefId: fieldDefSchema,
        value: "string"
    }
});

const ttgpSchema = new TableSchemaSingleRow<ThongTinGiaPha>({
    name: "thongTinGiaPha",
    fields: {
        idToTien: {
            type: personSchema,
            alias: "ancestor"
        },
        thongTinKhac: {
            type: "string",
            alias: "otherInfo"
        },
        tenDongHo: {
            type: "string",
            alias: "familyName"
        },
        type: "string",
        soDoiCuaToTien: {
            type: "integer",
            alias: "ancestorStartingNumber"
        }
    },
    initValue: getDefaultThongTinGiaPhaValue()
});

export const personDAO = personSchema.getDAO();
export const userDAO = userSchema.getDAO();
export const ttgpDASO = ttgpSchema.getDASO();
export const fieldDefDAO = fieldDefSchema.getDAO();
export const fieldValDAO = fieldValSchema.getDAO();

export const personAdvanceDAO: PersonAdvanceDAO = (() => {
    const isDevMode = process.env.NODE_ENV == "development";

    const isPersonBelongToFamily = async (id: string) => {
        const result = await personSchema.execSelectQuery(`
            SELECT ?x WHERE {
                person:${id} inferred:thuocGiaPha ?x
                FILTER (?x = "true")
            }
        `);

        return result.results.bindings.length > 0;
    };

    const isPeopleBelongToFamily = async (ids: string[]) => {
        const result = await personSchema.execSelectQuery<"x">(`
            SELECT ?x WHERE {
                ?x inferred:thuocGiaPha "true"
            }
        `);

        const validIds = new Set(result.results.bindings.map(
            t => personSchema.removeSelfPrefix(t.x.value)
        ));

        return ids.reduce((result, id) => {
            result[id] = validIds.has(id);
            return result;
        }, {} as Record<string, boolean>);
    };

    const relationshipAnalysis = async (p1: Person, p2: Person) => {
        const ttgp = await ttgpDASO.get();

        /**
         * Format object Person sang dạng text để in lỗi
         */
        const formatPersonAsText = (p: Person, capitalize = false) => {
            return `${capitalize ? "Person" : "person"} has name ${p.callname} (${p.id})`;
        };
    
        /**
         * Nhúng objêct Person như một chuỗi text, frontend sẽ xử lý để có thể bấm vào.
         */
        const escapePerson = (p: Person, text?: string) => {
            return `$person{id=${p.id}, {{${text || p.callname}}}}`;
        };
    
        const uncapitalize = (x: string) => {
            if (x.length == 0) return x;
            return x.charAt(0).toLowerCase() + x.slice(1);
        };
    
        /**
         * Tìm đường kết nối giữa hai người. Có thể xảy ra trường hợp có nhiều đường kết nối
         * (do trong dòng họ có loạn luân), khi đó chỉ trả về kết quả thứ nhất.
         */
        const findConnectingPath = async (p1: Person, p2: Person, delta: number): Promise<{ id: string, gender: Gender }[]> => {
            if (delta == 1) {
                return [{ id: p1.id, gender: p1.gender }, { id: p2.id, gender: p2.gender }];
            }
    
            const tripples: string[] = [];
            var selectStatement = "";
            var filterPart = "";
            for (let i = 0; i < delta; i++) {
                if (i == 0) {
                    tripples.push(
                        `person:${p1.id} ?r0 ?x0`,
                        "?x0 person:gender ?gx0"
                    );
                } else if (i < delta - 1) {
                    tripples.push(
                        `?x${i - 1} ?r${i} ?x${i}`,
                        `?x${i} person:gender ?gx${i}`
                    );
                } else {
                    // i == delta - 1
                    tripples.push(
                        `?x${i - 1} ?r${i} person:${p2.id}`
                    );
                }
    
                if (i < delta - 1) {
                    if (selectStatement != "") selectStatement += " ";
                    selectStatement += `?x${i} ?gx${i}`;
                }

                if (filterPart != "") filterPart += " && ";
                filterPart += `?r${i} in (person:hasFather, person:hasMother)`;
            }
    
            const selectResult = await personSchema.execSelectQuery(`
                SELECT ${selectStatement} WHERE {
                    ${tripples.join(" .\n")}
                    FILTER (${filterPart})
                }
            `);
    
            if (selectResult.results.bindings.length == 0) {
                throw Error(`Can't find connecting path between ${formatPersonAsText(p1)} and ${formatPersonAsText(p2)}`);
            }
    
            const result = [{ id: p1.id, gender: p1.gender }];
            for (let i = 0; i < delta - 1; i++) {
                const vars = selectResult.results.bindings[0];
    
                const id = personSchema.removeSelfPrefix(vars[`x${i}`].value);
                const gender = vars[`gx${i}`].value;
                
                if (gender == "MALE" || gender == "FEMALE") {
                    result.push({ id, gender });
                } else {
                    throw Error(`Found invalid gender: ${gender}`);
                }
            }
            result.push({ id: p2.id, gender: p2.gender });
    
            return result;
        };
    
        /**
         * Tìm xem p là đời thứ mấy. Nếu người đó có nhiều khả năng về số đời
         * (do trong dòng họ có loạn luân) thì ưu tiên số cao hoặc thấp tùy vào biến getMin.
         * Chú ý: Tổ tiên là đời thứ 1.
         */
        const findDoiThu = async (p: Person, getMin = false) => {
            const result = await personSchema.execSelectQuery<"x">(`
                SELECT ?x
                WHERE {
                    person:${p.id} inferred:doiThu ?x
                }
            `);
    
            if (result.results.bindings.length == 0) {
                return null;
            }
    
            const values = result.results.bindings.map(o => parseInt(o.x.value));
    
            return getMin ? Math.min(...values) : Math.max(...values);
        };
    
        /**
         * Vừa tìm đời thứ của cặp p và đời trên của p, vừa check lỗi của cặp này.
         */
        const findDoiThuOfPairOfPeople = async (pDoiTren: Person, p: Person): Promise<[delta: number, doiThuCuaPDoiTren: number, doiThuCuaP: number]> => {
            const [doiThuCuaPDoiTren, doiThuCuaP] = await Promise.all([
                findDoiThu(pDoiTren, true),
                findDoiThu(p)
            ]);
    
            if (!doiThuCuaPDoiTren) {
                throw Error(`Can't find doiThu of ${formatPersonAsText(pDoiTren)}`);
            }
    
            if (!doiThuCuaP) {
                throw Error(`Can't find doiThu of ${formatPersonAsText(p)}`);
            }
    
            const delta = doiThuCuaP - doiThuCuaPDoiTren;
            if (delta <= 0) {
                throw Error(
                    `${formatPersonAsText(pDoiTren, true)} is not "doiTren" of ${formatPersonAsText(p)}` +
                    `, because ${formatPersonAsText(pDoiTren)} has doiThu is ${doiThuCuaPDoiTren}` +
                    `, but ${formatPersonAsText(p)} has doiThu is ${doiThuCuaP}`
                );
            }
    
            return [delta, doiThuCuaPDoiTren, doiThuCuaP] as const;
        };

        const alalysisIndirectlyRelationship = async (p1: Person, p2: Person): Promise<RelationshipAnalysisResult | null> => {
            /**
             * Kiểm tra xem p1 có phải là đời trên của p2 hay không,
             * bằng cách kiểm tra sự tồn tại bộ ba `person:${p1.id} inferred:doiTren person:${p2.id}`.
             */
            const isDoiTren = async (p1: Person, p2: Person) => {
                const result = await personSchema.execSelectQuery<"x">(`
                    SELECT ?x
                    WHERE {
                        person:${p2.id} inferred:doiTren person:${p1.id} .
                        person:${p2.id} inferred:doiTren ?x
                    }
                `);

                return result.results.bindings.length > 0;
            };

            const [p1DoiTrenP2, p2DoiTrenP1] = await Promise.all([
                isDoiTren(p1, p2),
                isDoiTren(p2, p1)
            ]);

            /**
             * Xử lý trường hợp có một người là tổ tiên trực tiếp của người còn lại
             */
            const handleCaseAPersonIsDoiTrenOfOtherPerson = async (pDoiTren: Person, p: Person): Promise<RelationshipAnalysisResult> => {
                const [delta, doiThuCuaPDoiTren, doiThuCuaP] = await findDoiThuOfPairOfPeople(pDoiTren, p);

                // Quan hệ trực tiếp phải support cái này rồi, chỉ cần trả ra thông tin tối thiểu
                if (delta <= 4) {
                    return {
                        p1: {
                            wayOfCallingTheOther: null,
                            relationshipWithTheOtherDesc: null
                        },
                        p2: {
                            wayOfCallingTheOther: null,
                            relationshipWithTheOtherDesc: null
                        },
                        relationshipDetailDesc: null
                    };
                }

                const connectingPath = await findConnectingPath(p, pDoiTren, delta);

                return {
                    p1: {
                        wayOfCallingTheOther: null,
                        relationshipWithTheOtherDesc: null
                    },
                    p2: {
                        wayOfCallingTheOther: null,
                        relationshipWithTheOtherDesc: null
                    },
                    relationshipDetailDesc: [
                        escapePerson(pDoiTren), `(đời thứ ${doiThuCuaPDoiTren})`,
                        "là",
                        uncapitalize(relationshipWithDoiTrenDesc(connectingPath, ttgp.type == "phaHe")),
                        "của",
                        escapePerson(p), `(đời thứ ${doiThuCuaP})`
                    ].join(" ")
                };
            };

            if (p1DoiTrenP2) {
                return await handleCaseAPersonIsDoiTrenOfOtherPerson(p1, p2);
            }
            if (p2DoiTrenP1) {
                const result = await handleCaseAPersonIsDoiTrenOfOtherPerson(p2, p1);
                return {
                    ...result,
                    p1: result.p2,
                    p2: result.p1
                };
            }

            type CaseNoPersonIsNotDoiTrenOfTheOtherResult = {
                data: RelationshipAnalysisResult,
                /** Tất cả "Spouse" đề cập bên dưới là vợ chồng chứ không phải bạn đời đồng tính */
                p1Spouse: {
                    // The other here refers to P2
                    wayOfCallingTheOther: string | null,
                    wayOfCallingByTheOther: string | null,
                    wayOfCallingBySpouseTheOther: string | null
                },
                p2Spouse: {
                    // The other here refers to P1
                    wayOfCallingTheOther: string | null,
                    wayOfCallingByTheOther: string | null,
                    wayOfCallingBySpouseTheOther: string | null
                }
            };

            const handleCaseNoPersonIsNotDoiTrenOfTheOther = async (p1: Person, p2: Person): Promise<CaseNoPersonIsNotDoiTrenOfTheOtherResult | null> => {
                const preferRelationships = [
                    "AnhTrai", "EmTrai", "ChiGai", "EmGai"
                ] as const satisfies QuanHeTrucTiep[];
                type QuanHeAnhEmTrucTiep = (typeof preferRelationships)[number];
                const preferRelationshipsData: Record<QuanHeAnhEmTrucTiep, {
                    isVaiLon: boolean, // Banch of P1 is bigger
                    desc1: (p3: Person, p4: Person) => string;
                    desc2: string // Role of P4
                }> = {
                    AnhTrai: {
                        isVaiLon: false,
                        desc1: () => "Anh em ruột",
                        desc2: "Anh"
                    },
                    EmTrai: {
                        isVaiLon: true,
                        desc1: (p3: Person) => p3.gender == "MALE" ? "Anh em ruột" : "Chị em ruột",
                        desc2: "Em"
                    },
                    ChiGai: {
                        isVaiLon: false,
                        desc1: () => "Chị em ruột",
                        desc2: "Chị"
                    },
                    EmGai: {
                        isVaiLon: true,
                        desc1: (p3: Person) => p3.gender == "MALE" ? "Anh em ruột" : "Chị em ruột",
                        desc2: "Em"
                    }
                };

                type GeneralDataToHandle = {
                    doiThuP1: number,
                    doiThuP2: number,
                    relationshipP3P4: QuanHeAnhEmTrucTiep
                } & (
                    { p3IsP1: true } |
                    { p3IsP1: false, relationshipOfP3WithP1Desc: string, p3: Person, connectingPathP1P3: { id: string, gender: Gender }[] }
                ) & (
                    { p4IsP2: true } |
                    { p4IsP2: false, relationshipOfP4WithP2Desc: string, p4: Person, connectingPathP2P4: { id: string, gender: Gender }[] }
                );

                /**
                 * TH1: p1 và p2 là 2 anh chị em ruột
                 */
                const case1 = async (p1: Person, p2: Person): Promise<GeneralDataToHandle | null> => {
                    const selectResult = await personSchema.execSelectQuery<"r">(`
                        SELECT ?r
                        WHERE {
                            person:${p1.id} ?r person:${p2.id}
                            FILTER (?r in (${preferRelationships.map(r => `quanHeTrucTiep:${r}`).join(", ")}))
                        }
                    `);

                    if (selectResult.results.bindings.length == 0) return null;

                    const doiThuP1P2 = await findDoiThu(p1);
                    if (!doiThuP1P2) {
                        throw Error(`Something went wrong, can't find doiThu of p1, p2`);
                    }

                    const relationshipP3P4 = selectResult.results.bindings[0].r.value.replace(
                        Fuseki.PREDEDINED_PREFIXES.quanHeTrucTiep, ""
                    ) as QuanHeAnhEmTrucTiep;

                    return {
                        doiThuP1: doiThuP1P2,
                        doiThuP2: doiThuP1P2,
                        relationshipP3P4,
                        p3IsP1: true,
                        p4IsP2: true
                    };
                };

                /**
                 * Thử trường hợp p1 có đời trên nào đấy là p3 và p2 có đời trên nào đấy là p4, p3 và p4 là 2 anh chị em.
                 */
                const case2 = async (p1: Person, p2: Person): Promise<GeneralDataToHandle | null> => {
                    const selectResult = await personSchema.execSelectQuery<"p3" | "p4" | "r">(`
                        SELECT ?p3 ?r ?p4
                        WHERE {
                            person:${p1.id} inferred:doiTren ?p3 .
                            person:${p2.id} inferred:doiTren ?p4 .
                            ?p3 ?r ?p4
                            FILTER (?r in (${preferRelationships.map(r => `quanHeTrucTiep:${r}`).join(", ")}))
                        }
                    `);

                    if (selectResult.results.bindings.length == 0) return null;
    
                    const [p3, p4] = await Promise.all([
                        personDAO.findByPk(personSchema.removeSelfPrefix(selectResult.results.bindings[0].p3.value)),
                        personDAO.findByPk(personSchema.removeSelfPrefix(selectResult.results.bindings[0].p4.value))
                    ]);
        
                    if (!p3 || !p4) {
                        throw Error("Something went wrong");
                    }
        
                    const [[delta1, _1, doiThuP1], [delta2, _2, doiThuP2]] = await Promise.all([
                        findDoiThuOfPairOfPeople(p3, p1),
                        findDoiThuOfPairOfPeople(p4, p2)
                    ]);
        
                    const [cp1, cp2] = await Promise.all([
                        findConnectingPath(p1, p3, delta1),
                        findConnectingPath(p2, p4, delta2)
                    ]);
        
                    const [relationshipOfP3WithP1, relationshipOfP4WithP2] = [
                        relationshipWithDoiTrenDesc(cp1, ttgp.type == "phaHe"),
                        relationshipWithDoiTrenDesc(cp2, ttgp.type == "phaHe")
                    ] as const;

                    const relationshipP3P4 = selectResult.results.bindings[0].r.value.replace(
                        Fuseki.PREDEDINED_PREFIXES.quanHeTrucTiep, ""
                    ) as QuanHeAnhEmTrucTiep;

                    return {
                        relationshipP3P4,
                        doiThuP1,
                        doiThuP2,
                        p3IsP1: false,
                        relationshipOfP3WithP1Desc: relationshipOfP3WithP1,
                        p3,
                        connectingPathP1P3: cp1,
                        p4IsP2: false,
                        relationshipOfP4WithP2Desc: relationshipOfP4WithP2,
                        p4,
                        connectingPathP2P4: cp2
                    };
                };

                /**
                 * Thử trường hợp p1 với một đời trên nào đó của p2 là 2 anh chị em, hoặc ngược lại
                 */
                const case3 = async (p1: Person, p2: Person): Promise<GeneralDataToHandle | null> => {
                    /**
                     * Thử trường hợp px với một đời trên nào đó của py (trong code là pz) là 2 anh chị em
                     */
                    const test = async (px: Person, py: Person): Promise<{
                        relationshipPzWithPy: string,
                        relationshipPXPZ: QuanHeAnhEmTrucTiep,
                        doiThuPx: number;
                        doiThuPy: number;
                        pz: Person;
                        connectingPathPyPz: { id: string, gender: Gender }[]
                    } | null> => {
                        const selectResult = await personSchema.execSelectQuery<"pz" | "r">(`
                            SELECT ?pz ?r
                            WHERE {
                                person:${py.id} inferred:doiTren ?pz .
                                person:${px.id} ?r ?pz
                                FILTER (?r in (${preferRelationships.map(r => `quanHeTrucTiep:${r}`).join(", ")}))
                            }
                        `);
    
                        if (selectResult.results.bindings.length == 0) return null;
        
                        const pz = await personDAO.findByPk(personSchema.removeSelfPrefix(selectResult.results.bindings[0].pz.value));
                        if (!pz) {
                            throw Error("Something went wrong");
                        }

                        const [deltaYZ, doiThuPz, doiThuPy] = await findDoiThuOfPairOfPeople(pz, py);
            
                        const cpYZ = await findConnectingPath(py, pz, deltaYZ);
                        const relationshipPXPZ = selectResult.results.bindings[0].r.value.replace(
                            Fuseki.PREDEDINED_PREFIXES.quanHeTrucTiep, ""
                        ) as QuanHeAnhEmTrucTiep;

                        return {
                            doiThuPx: doiThuPz,
                            doiThuPy,
                            relationshipPXPZ,
                            relationshipPzWithPy: relationshipWithDoiTrenDesc(cpYZ, ttgp.type == "phaHe"),
                            pz,
                            connectingPathPyPz: cpYZ
                        };
                    };

                    const [test1Result, test2Result] = await Promise.all([
                        test(p1, p2),
                        test(p2, p1)
                    ]);

                    if (test1Result) {
                        return {
                            p3IsP1: true,
                            p4IsP2: false,
                            relationshipOfP4WithP2Desc: test1Result.relationshipPzWithPy,
                            p4: test1Result.pz,
                            connectingPathP2P4: test1Result.connectingPathPyPz,
                            doiThuP1: test1Result.doiThuPx,
                            doiThuP2: test1Result.doiThuPy,
                            relationshipP3P4: test1Result.relationshipPXPZ
                        };
                    } else if (test2Result) {
                        // Đảo ngược quan hệ
                        var relationshipP3P4: QuanHeAnhEmTrucTiep;

                        switch (test2Result.relationshipPXPZ) {
                            case "AnhTrai":
                            case "ChiGai":
                                if (test2Result.pz.gender == "MALE") {
                                    relationshipP3P4 = "EmTrai";
                                } else {
                                    relationshipP3P4 = "EmGai";
                                }
                                break;
                            case "EmTrai":
                            case "EmGai":
                                if (test2Result.pz.gender == "MALE") {
                                    relationshipP3P4 = "AnhTrai";
                                } else {
                                    relationshipP3P4 = "ChiGai";
                                }
                                break;
                            default:
                                const x: never = test2Result.relationshipPXPZ;
                                throw Error("Missing case!");
                        }

                        return {
                            p3IsP1: false,
                            relationshipOfP3WithP1Desc: test2Result.relationshipPzWithPy,
                            p3: test2Result.pz,
                            connectingPathP1P3: test2Result.connectingPathPyPz,
                            p4IsP2: true,
                            doiThuP1: test2Result.doiThuPy,
                            doiThuP2: test2Result.doiThuPx,
                            relationshipP3P4
                        };
                    }
                    return null;
                };

                const [result1, result2, result3] = await Promise.all([
                    case1(p1, p2),
                    case2(p1, p2),
                    case3(p1, p2)
                ]);

                const data = result1 || result2 || result3;
                if (!data) {
                    return null;
                }

                var vaiLon: Person;
                var vaiBe: Person;
                var p1IsVaiTren: boolean;
                const branchOfP1Bigger = preferRelationshipsData[data.relationshipP3P4].isVaiLon;

                if (data.doiThuP1 == data.doiThuP2) {
                    if (branchOfP1Bigger) {
                        vaiLon = p1;
                        vaiBe = p2;
                        p1IsVaiTren = true;
                    } else {
                        vaiLon = p2;
                        vaiBe = p1;
                        p1IsVaiTren = false;
                    }
                } else if (data.doiThuP1 > data.doiThuP2) {
                    vaiLon = p2;
                    vaiBe = p1;
                    p1IsVaiTren = false;
                } else {
                    vaiLon = p1;
                    vaiBe = p2;
                    p1IsVaiTren = true;
                }

                const delta = Math.abs(data.doiThuP1 - data.doiThuP2);
                var vaiTrenCallVaiDuoi: string | null;
                var vaiDuoiCallVaiTren: string | null;
                /** Spouse là vợ chồng chứ không phải bạn đời đồng tính */
                var vaiDuoiCallSpouseVaiTren: string | null;

                if (delta == 0) {
                    vaiTrenCallVaiDuoi = "Em";

                    if (vaiLon.gender == "FEMALE") {
                        vaiDuoiCallVaiTren = "Chị";
                        vaiDuoiCallSpouseVaiTren = "Anh";
                    } else {
                        vaiDuoiCallVaiTren = "Anh";
                        vaiDuoiCallSpouseVaiTren = "Chị";

                        if (vaiLon.gender != "MALE" && isDevMode) {
                            throw Error("Missing gender case");
                        }
                    }
                } else if (delta == 1) {
                    const vaiBeIsMale = vaiBe.gender == "MALE";
                    var parentVaiBeIsMale: boolean;
                    if (p1IsVaiTren) {
                        if ("connectingPathP2P4" in data) {
                            parentVaiBeIsMale = data.connectingPathP2P4[1].gender == "MALE";
                        } else {
                            throw Error("Data must contains connectingPathP2P4, because P2 is vai be");
                        }
                    } else {
                        if ("connectingPathP1P3" in data) {
                            parentVaiBeIsMale = data.connectingPathP1P3[1].gender == "MALE";
                        } else {
                            throw Error("Data must contains connectingPathP1P3, because P1 is vai be");
                        }
                    }
                    const parentVaiBeIsVaiLonHon = p1IsVaiTren ? (!branchOfP1Bigger) : (branchOfP1Bigger);

                    vaiTrenCallVaiDuoi = "Cháu";
                    if (parentVaiBeIsMale) {
                        if (parentVaiBeIsVaiLonHon) {
                            if (vaiBeIsMale) {
                                vaiDuoiCallVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["EmTraiCuaBo"].wayOfCalling;
                                vaiDuoiCallSpouseVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["VoCuaEmTraiCuaBo"].wayOfCalling;
                            } else {
                                vaiDuoiCallVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["EmGaiCuaBo"].wayOfCalling;
                                vaiDuoiCallSpouseVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["ChongCuaEmGaiCuaBo"].wayOfCalling;
                            }
                        } else {
                            if (vaiBeIsMale) {
                                vaiDuoiCallVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["AnhTraiCuaBo"].wayOfCalling;
                                vaiDuoiCallSpouseVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["VoCuaAnhTraiCuaBo"].wayOfCalling;
                            } else {
                                vaiDuoiCallVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["ChiGaiCuaBo"].wayOfCalling;
                                vaiDuoiCallSpouseVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["ChongCuaChiGaiCuaBo"].wayOfCalling;
                            }
                        }
                    } else {
                        if (parentVaiBeIsVaiLonHon) {
                            if (vaiBeIsMale) {
                                vaiDuoiCallVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["EmTraiCuaMe"].wayOfCalling;
                                vaiDuoiCallSpouseVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["VoCuaEmTraiCuaMe"].wayOfCalling;
                            } else {
                                vaiDuoiCallVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["EmGaiCuaMe"].wayOfCalling;
                                vaiDuoiCallSpouseVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["ChongCuaEmGaiCuaMe"].wayOfCalling;
                            }
                        } else {
                            if (vaiBeIsMale) {
                                vaiDuoiCallVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["AnhTraiCuaMe"].wayOfCalling;
                                vaiDuoiCallSpouseVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["VoCuaAnhTraiCuaMe"].wayOfCalling;
                            } else {
                                vaiDuoiCallVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["ChiGaiCuaMe"].wayOfCalling;
                                vaiDuoiCallSpouseVaiTren = ALL_QUAN_HE_TRUC_TIEP_INFO["ChongCuaChiGaiCuaMe"].wayOfCalling;
                            }
                        }
                    }
                } else if (delta == 2) {
                    vaiDuoiCallVaiTren = vaiLon.gender == "MALE" ? "Ông" : "Bà";
                    vaiDuoiCallSpouseVaiTren = vaiLon.gender == "MALE" ? "Bà" : "Ông";
                    vaiTrenCallVaiDuoi = "Cháu";
                } else if (delta == 3) {
                    vaiDuoiCallVaiTren = vaiLon.gender == "MALE" ? "Ông cố" : "Bà cố";
                    vaiDuoiCallSpouseVaiTren = vaiLon.gender == "MALE" ? "Bà cố" : "Ông cố";
                    vaiTrenCallVaiDuoi = null;
                } else if (delta == 4) {
                    vaiDuoiCallVaiTren = vaiLon.gender == "MALE" ? "Ông kỵ" : "Bà kỵ";
                    vaiDuoiCallSpouseVaiTren = vaiLon.gender == "MALE" ? "Bà kỵ" : "Ông kỵ";
                    vaiTrenCallVaiDuoi = null;
                } else {
                    vaiDuoiCallVaiTren = "Cụ";
                    vaiDuoiCallSpouseVaiTren = "Cụ";
                    vaiTrenCallVaiDuoi = null;
                }

                const vaiTrenInfo: RelationshipAnalysisResult["p1"] = {
                    wayOfCallingTheOther: vaiTrenCallVaiDuoi,
                    relationshipWithTheOtherDesc: null
                };
                const vaiTrenSpouseInfo: CaseNoPersonIsNotDoiTrenOfTheOtherResult["p1Spouse"] = {
                    wayOfCallingTheOther: vaiTrenCallVaiDuoi,
                    wayOfCallingByTheOther: vaiDuoiCallSpouseVaiTren,
                    wayOfCallingBySpouseTheOther: vaiDuoiCallSpouseVaiTren
                };
                const vaiDuoiInfo: RelationshipAnalysisResult["p1"] = {
                    wayOfCallingTheOther: vaiDuoiCallVaiTren,
                    relationshipWithTheOtherDesc: null
                };
                const vaiDuoiSpouseInfo: CaseNoPersonIsNotDoiTrenOfTheOtherResult["p1Spouse"] = {
                    wayOfCallingTheOther: vaiDuoiCallVaiTren,
                    wayOfCallingByTheOther: vaiTrenCallVaiDuoi,
                    wayOfCallingBySpouseTheOther: vaiTrenCallVaiDuoi
                };

                const s1 = data.p3IsP1 ? escapePerson(p1) : `${escapePerson(data.p3)} (${uncapitalize(data.relationshipOfP3WithP1Desc)} của ${escapePerson(p1)})`;
                const s2 = data.p4IsP2 ? escapePerson(p2) : `${escapePerson(data.p4)} (${uncapitalize(data.relationshipOfP4WithP2Desc)} của ${escapePerson(p2)})`;
                const desc1 = preferRelationshipsData[data.relationshipP3P4].desc1(
                    data.p3IsP1 ? p1 : data.p3,
                    data.p4IsP2 ? p2 : data.p4
                );

                return {
                    data: {
                        p1: p1IsVaiTren ? vaiTrenInfo : vaiDuoiInfo,
                        p2: p1IsVaiTren ? vaiDuoiInfo : vaiTrenInfo,
                        relationshipDetailDesc: `${s1} và ${s2} là hai ${uncapitalize(desc1)}`
                            + ` (${(data.p4IsP2 ? p2 : data.p4).callname} là ${uncapitalize(preferRelationshipsData[data.relationshipP3P4].desc2)})`
                    },
                    p1Spouse: p1IsVaiTren ? vaiTrenSpouseInfo : vaiDuoiSpouseInfo,
                    p2Spouse: p1IsVaiTren ? vaiDuoiSpouseInfo : vaiTrenSpouseInfo
                };
            };

            const r1 = await handleCaseNoPersonIsNotDoiTrenOfTheOther(p1, p2);
            if (r1) {
                return r1.data;
            }

            const [spouseP1, spouseP2] = await Promise.all([
                p1.spouseId ? personDAO.findByPk(p1.spouseId) : Promise.resolve(null),
                p2.spouseId ? personDAO.findByPk(p2.spouseId) : Promise.resolve(null)
            ]);

            if (!spouseP1 && !spouseP2) {
                return null;
            }

            const vaiTroVoHayChong = (p: Person, capitalize = false) => {
                const x = p.gender == "MALE" ? "Chồng" : "Vợ";
                if (capitalize) {
                    return x;
                }
                return uncapitalize(x);
            };

            if (spouseP1) {
                const r2 = await handleCaseNoPersonIsNotDoiTrenOfTheOther(spouseP1, p2);
                if (r2) {
                    if (spouseP1.gender == p1.gender) {
                        return {
                            p1: {
                                wayOfCallingTheOther: null,
                                relationshipWithTheOtherDesc: null
                            },
                            p2: {
                                wayOfCallingTheOther: null,
                                relationshipWithTheOtherDesc: null
                            },
                            relationshipDetailDesc: `${escapePerson(p1)} có bạn đời đồng tính là ${escapePerson(spouseP1)}. ${r2.data.relationshipDetailDesc}`
                        };
                    } else {
                        return {
                            p1: {
                                wayOfCallingTheOther: r2.p1Spouse.wayOfCallingTheOther,
                                relationshipWithTheOtherDesc: null
                            },
                            p2: {
                                wayOfCallingTheOther: r2.p1Spouse.wayOfCallingByTheOther,
                                relationshipWithTheOtherDesc: null
                            },
                            relationshipDetailDesc: `${escapePerson(p1)} có ${vaiTroVoHayChong(spouseP1)} là ${escapePerson(spouseP1)}. ${r2.data.relationshipDetailDesc}`
                        };
                    }
                }
            }

            if (spouseP2) {
                const r2 = await handleCaseNoPersonIsNotDoiTrenOfTheOther(p1, spouseP2);
                if (r2) {
                    if (spouseP2.gender == p2.gender) {
                        return {
                            p1: {
                                wayOfCallingTheOther: null,
                                relationshipWithTheOtherDesc: null
                            },
                            p2: {
                                wayOfCallingTheOther: null,
                                relationshipWithTheOtherDesc: null
                            },
                            relationshipDetailDesc: `${escapePerson(p2)} có bạn đời đồng tính là ${escapePerson(spouseP2)}. ${r2.data.relationshipDetailDesc}`
                        };
                    } else {
                        return {
                            p1: {
                                wayOfCallingTheOther: r2.p2Spouse.wayOfCallingByTheOther,
                                relationshipWithTheOtherDesc: null
                            },
                            p2: {
                                wayOfCallingTheOther: r2.p2Spouse.wayOfCallingTheOther,
                                relationshipWithTheOtherDesc: null
                            },
                            relationshipDetailDesc: `${escapePerson(p2)} có ${vaiTroVoHayChong(spouseP2)} là ${escapePerson(spouseP2)}. ${r2.data.relationshipDetailDesc}`
                        };
                    }
                }
            }

            if (spouseP1 && spouseP2) {
                const r2 = await handleCaseNoPersonIsNotDoiTrenOfTheOther(spouseP1, spouseP2);
                if (r2) {
                    if (spouseP1.gender == p1.gender || spouseP2.gender == p2.gender) {
                        return {
                            p1: {
                                wayOfCallingTheOther: null,
                                relationshipWithTheOtherDesc: null
                            },
                            p2: {
                                wayOfCallingTheOther: null,
                                relationshipWithTheOtherDesc: null
                            },
                            relationshipDetailDesc: `${escapePerson(p1)} có ${p1.gender == spouseP1.gender ? "bạn đời đồng tính" : vaiTroVoHayChong(spouseP1)} là ${escapePerson(spouseP1)}`
                                + `, ${escapePerson(p2)} có ${p2.gender == spouseP2.gender ? "bạn đời đồng tính" : vaiTroVoHayChong(spouseP2)} là ${escapePerson(spouseP2)}`
                                + `. ${r2.data.relationshipDetailDesc}`
                        };
                    } else {
                        return {
                            p1: {
                                wayOfCallingTheOther: r2.p1Spouse.wayOfCallingBySpouseTheOther,
                                relationshipWithTheOtherDesc: null
                            },
                            p2: {
                                wayOfCallingTheOther: r2.p2Spouse.wayOfCallingBySpouseTheOther,
                                relationshipWithTheOtherDesc: null
                            },
                            relationshipDetailDesc: `${escapePerson(p1)} có ${vaiTroVoHayChong(spouseP1)} là ${escapePerson(spouseP1)}`
                                + `, ${escapePerson(p2)} có ${vaiTroVoHayChong(spouseP2)} là ${escapePerson(spouseP2)}`
                                + `. ${r2.data.relationshipDetailDesc}`
                        };
                    }
                }
            }

            return null;
        };
    
        const directlyRelationshipAnalysis = async (p1: Person, p2: Person): Promise<RelationshipAnalysisResult | null> => {
            const getDirectRelationships = async (id1: string, id2: string) => {
                const result = await personSchema.execSelectQuery<"r">(`
                    SELECT ?r WHERE {
                        person:${id1} ?r person:${id2}
                        FILTER (CONTAINS(STR(?r), "${Fuseki.PREDEDINED_PREFIXES.quanHeTrucTiep}"))
                    }
                `);
    
                const directRelationships: QuanHeTrucTiep[] = [];
                result.results.bindings.forEach(o => {
                    const r = o.r.value.replace(Fuseki.PREDEDINED_PREFIXES.quanHeTrucTiep, "");
                    if (isQuanHeTrucTiep(r)) {
                        directRelationships.push(r);
                    } else {
                        if (isDevMode) {
                            throw Error(`"${r} is not a direct relationship"`);
                        }
                    }
                });
    
                return directRelationships;
            };
    
            const [_r2to1s, _r1to2s] = await Promise.all([
                getDirectRelationships(p1.id, p2.id),
                getDirectRelationships(p2.id, p1.id)
            ]);
    
            const r2to1s = sortQuanHeByCloseness(_r2to1s);
            const r1to2s = sortQuanHeByCloseness(_r1to2s);
    
            if (r2to1s.length == 0 || r1to2s.length == 0) {
                return null;
            }
    
            var r2to1: QuanHeTrucTiep | undefined;
            var r1to2: QuanHeTrucTiep | undefined;
    
            if (r2to1s.length > 0) {
                r2to1 = r2to1s[0];
                const r2to1Opposite = OPPOSITE_RELATIONSHIPS[r2to1];
                if (!r2to1Opposite) {
                    r1to2 = undefined;
                } else {
                    r1to2 = r1to2s.find(r => {
                        if (r == r2to1Opposite[0]) return true;
                        if (r2to1Opposite[1]) {
                            return r2to1Opposite[1].includes(r);
                        }
                        return false;
                    });
                }
            } else {
                r1to2 = r1to2s[0];
                r2to1 = undefined;
            }
    
            if (isDevMode) {
                const test = (r: QuanHeTrucTiep, list: QuanHeTrucTiep[]) => {
                    const opposite = OPPOSITE_RELATIONSHIPS[r];
                    if (opposite) {
                        const result = [opposite[0], ...(opposite[1] || [])].some(r2 => {
                            if (list.includes(r2)) {
                                return true;
                            }
                            return false;
                        });
    
                        return result;
                    }
                    return true;
                };
    
                r2to1s.forEach(r => {
                    if (!test(r, r1to2s)) {
                        throw Error(`Relationship ${r} has opposite relationship, but not found!`)
                    }
                });
    
                r1to2s.forEach(r => {
                    if (!test(r, r2to1s)) {
                        throw Error(`Relationship ${r} has opposite relationship, but not found!`)
                    }
                });
            }

            const resultQuanHeGianTiep = await alalysisIndirectlyRelationship(p1, p2);

            const temp1 = r2to1 ? ALL_QUAN_HE_TRUC_TIEP_INFO[r2to1].wayOfCalling : null;
            const temp2 = r1to2 ? ALL_QUAN_HE_TRUC_TIEP_INFO[r1to2].wayOfCalling : null;

            return {
                p1: r2to1
                    ? {
                        wayOfCallingTheOther: temp1
                            ? (typeof temp1 == "string" ? temp1 : temp1(p2))
                            : (resultQuanHeGianTiep?.p1.wayOfCallingTheOther || null),
                        relationshipWithTheOtherDesc: ALL_QUAN_HE_TRUC_TIEP_INFO[r2to1].desc || resultQuanHeGianTiep?.p1.relationshipWithTheOtherDesc || null
                    }
                    : {
                        wayOfCallingTheOther: resultQuanHeGianTiep?.p1.wayOfCallingTheOther || null,
                        relationshipWithTheOtherDesc: resultQuanHeGianTiep?.p1.relationshipWithTheOtherDesc || null
                    },
                p2: r1to2
                    ? {
                        wayOfCallingTheOther: temp2
                            ? (typeof temp2 == "string" ? temp2 : temp2(p1))
                            : (resultQuanHeGianTiep?.p2.wayOfCallingTheOther || null),
                        relationshipWithTheOtherDesc: ALL_QUAN_HE_TRUC_TIEP_INFO[r1to2].desc || resultQuanHeGianTiep?.p2.relationshipWithTheOtherDesc || null
                    }
                    : {
                        wayOfCallingTheOther: resultQuanHeGianTiep?.p2.wayOfCallingTheOther || null,
                        relationshipWithTheOtherDesc: resultQuanHeGianTiep?.p2.relationshipWithTheOtherDesc || null
                    },
                relationshipDetailDesc: (
                    (r2to1 ? ALL_QUAN_HE_TRUC_TIEP_INFO[r2to1].needMoreDesc : true) ||
                    (r1to2 ? ALL_QUAN_HE_TRUC_TIEP_INFO[r1to2].needMoreDesc : true)
                ) ? resultQuanHeGianTiep?.relationshipDetailDesc || null : null
            };
        };

        const r1 = await directlyRelationshipAnalysis(p1, p2);
        if (r1) return r1;

        const r2 = await alalysisIndirectlyRelationship(p1, p2);
        if (r2) return r2;

        return null;
    };

    return {
        isPersonBelongToFamily,
        isPeopleBelongToFamily,
        relationshipAnalysis
    };
})();

