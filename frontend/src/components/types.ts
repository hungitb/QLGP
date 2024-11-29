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

export enum PersonCardLayout {
  MIN_HEIGHT = "MIN_HEIGHT",
  MIN_WIDTH = "MIN_WIDTH",
}

export type FamilyCardConfig = {
  level: number;
  show: {
    image: boolean;
    name: boolean;
    gender: boolean;
    birthdate: boolean;
    status: boolean;
  };
  layout: PersonCardLayout;
  horizontalDistance: number;
  verticalDistance: number;
};
