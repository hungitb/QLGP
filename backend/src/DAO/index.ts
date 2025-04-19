// import * as RealDAO from "./database/database";
import * as FakeDAO from "./fake/FakeDAO";
import * as FusekiDAO from "./fuseki/schema";

const fakeData = process.env.QLGP_BACKEND_FAKE_DB == "true";

export const personDAO = fakeData ? FakeDAO.personDAO : FusekiDAO.personDAO;
// export const fieldDefDAO = fakeData ? FakeDAO.fieldDefDAO : FusekiDAO.fieldDefDAO;
// export const fieldValDAO = fakeData ? FakeDAO.fieldValDAO : FusekiDAO.fieldValDAO;
export const userDAO = fakeData ? FakeDAO.userDAO : FusekiDAO.userDAO;
export const ttgpDASO = fakeData ? FakeDAO.ttgpDASO : FusekiDAO.ttgpDASO;
export const personAdvanceDAO = fakeData ? (null as any) : FusekiDAO.personAdvanceDAO;
