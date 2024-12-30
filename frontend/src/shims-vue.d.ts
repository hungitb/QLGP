declare module "*.vue" {
  import Vue from "vue";
  export default Vue;

  export function showDialogAddOrCreatePerson(data: any): void;
  export function showDialogConfirm(data: any): void;
  export function showDialogAddPersonWithSpecificRole(data: any): void;
  export function showDialogPersonDetailInfo(data: any): void;
  export function showSnackbar(data: any): void;
  export function showImage(data: any): void;
}
