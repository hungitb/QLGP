import * as RealDAO from "./database";
import * as FakeDAO from "./FakeDAO";

const fakeData = process.env.QLGP_BACKEND_FAKE_DB == "true";

export const personDAO = fakeData ? FakeDAO.personDAO : RealDAO.personDAO;
export const fieldDefDAO = fakeData ? FakeDAO.fieldDefDAO : RealDAO.fieldDefDAO;
export const fieldValDAO = fakeData ? FakeDAO.fieldValDAO : RealDAO.fieldValDAO;
export const userDAO = fakeData ? FakeDAO.userDAO : RealDAO.userDAO;
export const eventSettingDAO = fakeData ? FakeDAO.eventSettingDAO : RealDAO.eventSettingDAO;
