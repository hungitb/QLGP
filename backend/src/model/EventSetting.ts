
export enum EventTargetType {
    ALL = "ALL",
    SPECIFIC_PEOPLE = "SPECIFIC_PEOPLE",
    PEOPLE_IN_FAMILY_TREE_LEVEL_TWO = "PEOPLE_IN_FAMILY_TREE_LEVEL_TWO",
    PEOPLE_IN_FAMILY_TREE_LEVEL_THREE = "PEOPLE_IN_FAMILY_TREE_LEVEL_THREE",
}

export enum EventType {
    BIRTHDATE = "BIRTHDATE",
    BIRTHDAY = "BIRTHDAY",
    DEATHDATE = "DEATHDATE",
    DEATHDAY = "DEATHDAY",
    GIO_7_NGAY = "GIO_7_NGAY",
    GIO_49_NGAY = "GIO_49_NGAY",
    GIO_100_NGAY = "GIO_100_NGAY",
    LE_DAY_THANG_LICH_AM = "LE_DAY_THANG_LICH_AM",
    LE_DAY_THANG_LICH_DUONG = "LE_DAY_THANG_LICH_DUONG",
    LE_CUNG_THOI_NOI_LICH_AM = "LE_CUNG_THOI_NOI_LICH_AM",
    LE_CUNG_THOI_NOI_LICH_DUONG = "LE_CUNG_THOI_NOI_LICH_DUONG"
}

export const allEventTypes = [
  {
    text: "Sinh nhật",
    value: EventType.BIRTHDAY,
    desc: "Sinh nhật, sự kiện này diễn ra một năm một lần",
  },
  {
    text: "Giỗ năm",
    value: EventType.DEATHDAY,
    desc: "Ngày giỗ, sự kiện này diễn ra một năm một lần",
  },
  {
    text: "Giỗ 7 ngày",
    value: EventType.GIO_7_NGAY,
    desc: "Hay còn gọi là cúng thất tuần là một nghi lễ quan trọng trong phong tục ma chay.",
  },
  {
    text: "Giỗ 49 ngày",
    value: EventType.GIO_49_NGAY,
    desc: "Giỗ 49 ngày là một nghi lễ tâm linh quan trọng trong văn hóa Việt Nam.",
  },
  {
    text: "Giỗ 100 ngày",
    value: EventType.GIO_100_NGAY,
    desc: "Giỗ 100 ngày là một nghi lễ quan trọng, thể hiện lòng thành kính và tưởng nhớ đến người đã khuất.",
  },
  // {
  //   text: "Lễ đầy tháng (lịch âm)",
  //   value: EventType.LE_DAY_THANG_LICH_AM,
  //   desc: "Là nghi thức truyền thống đánh dấu cột mốc đầu tiên trong cuộc đời của một đứa trẻ.",
  // },
  // {
  //   text: "Lễ đầy tháng (lịch dương)",
  //   value: EventType.LE_DAY_THANG_LICH_DUONG,
  //   desc: "Là nghi thức truyền thống đánh dấu cột mốc đầu tiên trong cuộc đời của một đứa trẻ.",
  // },
  // {
  //   text: "Lễ cúng thôi nôi (lịch âm)",
  //   value: EventType.LE_CUNG_THOI_NOI_LICH_AM,
  //   desc: "Là nghi thức truyền thống đánh dấu cột mốc tròn một tuổi của trẻ sơ sinh",
  // },
  // {
  //   text: "Lễ cúng thôi nôi (lịch dương)",
  //   value: EventType.LE_CUNG_THOI_NOI_LICH_DUONG,
  //   desc: "Là nghi thức truyền thống đánh dấu cột mốc tròn một tuổi của trẻ sơ sinh",
  // },
];

export interface EventSetting {
    userId: string;

    targetType: EventTargetType;
    types: string;

    specificPersonIds: string;
    numGenerationsAbove: number;
    numGenerationsBelow: number;
    includePeopleEqualGeneration: boolean;
}
