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
