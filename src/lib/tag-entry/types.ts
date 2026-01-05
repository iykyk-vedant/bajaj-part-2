export interface TagEntry {
  id?: string | number;
  srNo: string;
  dcNo: string;
  dcDate?: string;
  branch: string;
  bccdName: string;
  productDescription: string;
  productSrNo: string;
  dateOfPurchase: string;
  complaintNo: string;
  partCode: string;
  natureOfDefect: string;
  visitingTechName: string;
  mfgMonthYear: string;
  repairDate?: string;
  testing?: string;
  failure?: string;
  status?: string;
  pcbSrNo: string;
  rfObservation?: string;
  analysis?: string;
  validationResult?: string;
  componentChange?: string;
  enggName?: string;
  tagEntryBy?: string;
  consumptionEntryBy?: string;
  dispatchEntryBy?: string;
  dispatchDate?: string;
}

export interface ConsumptionEntry {
  id?: string;
  repairDate: string;
  testing: string;
  failure: string;
  status: string;
  pcbSrNo: string;
  rfObservation: string;
  analysis: string;
  validationResult: string;
  componentChange: string;
  enggName: string;
  dispatchDate: string;
}

export interface Settings {
  dcNo: string;
  partCode: string;
  userId: string;
  password: string;
  userStatus: string;
  engineerName: string;
}