import api from "./api";
import {
  useBackend,
  getLoggedInUserLocalStorage,
  stringifyValuesOfObject,
} from "./utils";
import getEventController from "../../../general/controller/event";
import { eventSettingDAO, personDAO } from "./DAO";
import { EventSetting } from "../../../general/model/EventSetting";

const eventController = getEventController(eventSettingDAO, personDAO);

export const eventApi = {
  async getEvents(data: { startDate?: string; endDate?: string } = {}) {
    if (useBackend) {
      // to do
    }

    return await eventController.getEvents(
      stringifyValuesOfObject(data),
      await getLoggedInUserLocalStorage()
    );
  },
  async updateEventSetting(data: Partial<EventSetting>) {
    if (useBackend) {
      // to do
    }

    return await eventController.updateEventSetting(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
};
