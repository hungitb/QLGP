import {
  convertAdvanceSufixedLunarDateToSufixedLunarDate,
  convertSufixedLunarDateToStandardLunarDate,
  DateInputDB,
  DateStoredDB,
  isAdvanceSufixedLunarDate,
  isSufixedLunarDate,
  SufixedLunarDate,
  sufixedLunarDateToNormalDate,
} from "../../backend/src/utils/DateUtils";
import { DateFormat, FamilyCardConfig } from "./components/types";
import store from "./store";

export function checkIfIsMobile() {
  let isMobile = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
        a.substr(0, 4)
      )
    )
      isMobile = true;
  })(navigator.userAgent || navigator.vendor || (window as any).opera);

  return isMobile;
}

export function handleDateInputValue([date, type]: [
  date: string,
  type: DateFormat
]): DateStoredDB | null {
  if (date == "") return null;
  if (type == DateFormat.dmyAL) {
    const lunarDate = (date + "AL") as SufixedLunarDate;
    date = lunarDate + sufixedLunarDateToNormalDate(lunarDate);
  }
  return date as DateStoredDB;
}

export function convertToDateInputValue(
  s: DateStoredDB | null,
  defaultDateType: DateFormat
): [date: string, type: DateFormat] {
  if (!s) return ["", defaultDateType];

  if (isAdvanceSufixedLunarDate(s)) {
    return [
      convertSufixedLunarDateToStandardLunarDate(
        convertAdvanceSufixedLunarDateToSufixedLunarDate(s)
      ),
      DateFormat.dmyAL,
    ];
  }

  const numParts = s.split("/").length;
  if (numParts == 1) {
    return [s, DateFormat.y];
  }
  if (numParts == 2) {
    return [s, DateFormat.my];
  }
  return [s, DateFormat.dmy];
}

let currentNumber = 0;
export function getUniqueID() {
  currentNumber++;
  return "fm" + currentNumber;
}

export function resizeImageSrc(imageSrc: string): Promise<string> {
  const LIMIT = process.env.QLGP_USE_BACKEND == "true" ? 5_000_000 : 100_000;

  return new Promise((resolve) => {
    if (imageSrc.length < LIMIT) {
      resolve(imageSrc);
      return;
    }

    const imgElem = new Image();
    imgElem.src = imageSrc;

    imgElem.onload = () => {
      start(imgElem.height, imgElem.width);
    };

    function start(height: number, width: number, coff = 0.9) {
      const canvas = document.createElement("canvas");
      const raito = (coff * imageSrc.length) / LIMIT;

      canvas.width = width / Math.sqrt(raito);
      canvas.height = height / Math.sqrt(raito);

      const context2D = canvas.getContext("2d");
      if (!context2D) {
        return resolve("");
      }

      context2D.drawImage(imgElem, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL("image/jpeg");
      if (result.length < LIMIT) resolve(result);
      else start(height, width, coff + 0.05);
    }
  });
}

type EventSetting = {
  allPeople: boolean;
  eventTypes?: string[];
  personIds?: string[];
};

export function getEventSettingFromLocalStorage(): EventSetting {
  try {
    const data = JSON.parse(localStorage.getItem("QLGP.eventSetting") || "{}");
    return {
      allPeople: data.allPeople !== false,
      eventTypes:
        typeof data.eventTypes == "string"
          ? data.eventTypes.split(",").filter((et) => et)
          : undefined,
      personIds:
        typeof data.personIds == "string"
          ? data.personIds.split(",")
          : undefined,
    };
  } catch (e) {
    return {
      allPeople: true,
    };
  }
}

export function saveEventSettingToLocalStorage(setting: Partial<EventSetting>) {
  setting = Object.assign(getEventSettingFromLocalStorage(), setting);

  localStorage.setItem(
    "QLGP.eventSetting",
    JSON.stringify({
      allPeople: setting.allPeople,
      eventTypes: setting.eventTypes?.join(","),
      personIds: setting.personIds?.join(","),
    })
  );
}

type FamilyTreeSettingLocalStorage = {
  drawSpouse: boolean;
  expandNonRelatedFamily: boolean;
  personCardLayoutConfig: "VERTICAL" | "HORIZONTAL";
};

export function getFamilyTreeSettingFromLocalStorage(): FamilyTreeSettingLocalStorage {
  try {
    const data: any = JSON.parse(
      localStorage.getItem("QLGP.familyTreeSetting") || "{}"
    );
    if (
      data &&
      typeof data == "object" &&
      "drawSpouse" in data &&
      typeof data.drawSpouse == "boolean" &&
      "expandNonRelatedFamily" in data &&
      typeof data.expandNonRelatedFamily == "boolean" &&
      "personCardLayoutConfig" in data
    ) {
      return {
        drawSpouse: data.drawSpouse,
        expandNonRelatedFamily: data.expandNonRelatedFamily,
        personCardLayoutConfig:
          data.personCardLayoutConfig == "VERTICAL" ? "VERTICAL" : "HORIZONTAL",
      };
    }
    throw Error("Catch block!");
  } catch (e) {
    return {
      drawSpouse: true,
      expandNonRelatedFamily: false,
      personCardLayoutConfig: "VERTICAL",
    };
  }
}

export function saveFamilyTreeToLocalStorage(
  setting: FamilyTreeSettingLocalStorage
) {
  localStorage.setItem("QLGP.familyTreeSetting", JSON.stringify(setting));
}

type PermissionMixinThis = {
  $store: typeof store;
};

export const permissionMixin = {
  methods: {
    isAdmin(this: PermissionMixinThis) {
      return this.$store.state.user.permission === "admin";
    },
    canWrite(this: PermissionMixinThis) {
      const user = this.$store.state.user;
      return user.permission == "admin" || user.permission == "write";
    },
  },
};
