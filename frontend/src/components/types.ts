export type CustomDialogButtonProp = {
  text: string;
  color?: string;
  click: (closeDialog: () => void) => any;
};

export enum DateFormat {
  y = "Năm",
  my = "Tháng/Năm",
  dmy = "Ngày/Tháng/Năm",
  dmyAL = "Ngày/Tháng/Năm Âm lịch",
}

export type PersonCardConfig = {
  layout: "HORIZONTAL" | "VERTICAL";
  elementsDisplayedDict: {
    image: boolean;
    name: boolean;
    gender: boolean;
    birthdate: boolean;
    status: boolean;
  };
}

export type FamilyCardConfig = {
  /** Có vẽ bạn đời của người trong gia phả hay không */
  drawSpouse: boolean;

  /** Có mở rộng gia đình của nữ trong phả hệ hoặc Nam trong mẫu hệ hay không */
  expandNonRelatedFamily: boolean;

  personCardConfig: PersonCardConfig;
  horizontalDistance: number;
  verticalDistance: number;
};
