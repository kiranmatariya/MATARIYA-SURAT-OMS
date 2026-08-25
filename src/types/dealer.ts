export type DealerStatus = "ACTIVE" | "INACTIVE";

export interface Dealer {
  id: string;
  name: string;
  mobileNumber: string;
  alternateMobileNumber: string;
  city: string;
  state: string;
  gstNumber: string;
  remarks: string;
  status: DealerStatus;
  masterAreaId: string;
  masterAreaName: string;
  transport: string;
  bookingCenter: string;
  createdAt: string;
  updatedAt: string;
}

export type DealerInput = Pick<
  Dealer,
  | "name"
  | "mobileNumber"
  | "alternateMobileNumber"
  | "city"
  | "state"
  | "gstNumber"
  | "remarks"
  | "status"
  | "transport"
  | "bookingCenter"
  | "masterAreaId"
>;

export interface MasterArea { id: string; name: string; sortOrder: number; status: DealerStatus; createdAt: string; updatedAt: string; }
export type MasterAreaInput = Pick<MasterArea, "name" | "sortOrder" | "status">;
