import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
  getLoggedInUserLocalStorage,
  stringifyValuesOfObject,
} from "./utils";
import getEventController from "../../../backend/src/controller/event";
import { eventSettingDAO, personDAO, wrapApi } from "./DAO";
import { EventSetting } from "../../../backend/src/model/EventSetting";

const eventController = getEventController(eventSettingDAO, personDAO);

export const eventApi = wrapApi({
  async getEvents(data: { startDate?: string; endDate?: string } = {}) {
    if (useBackend) {
      return await wrapAxiosCall(() => api.get("/event/all", { params: data }));
    }

    return await eventController.getEvents(
      stringifyValuesOfObject(data),
      await getLoggedInUserLocalStorage()
    );
  },
  async updateEventSetting(data: Partial<EventSetting>) {
    if (useBackend) {
      return await wrapAxiosCall(() => api.patch("/event", data));
    }

    return await eventController.updateEventSetting(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
});
