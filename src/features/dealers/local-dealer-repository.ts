import type { Dealer } from "@/types/dealer";
import type { DealerRepository } from "./dealer-repository";

const STORAGE_KEY = "matariya-surat-oms:dealers:v1";

const starterDealers: Dealer[] = [
  {
    id: "dealer-shree-krishna",
    name: "Shree Krishna Electricals",
    mobileNumber: "98765 43210",
    alternateMobileNumber: "",
    city: "Ahmedabad",
    state: "Gujarat",
    gstNumber: "24ABCDE1234F1Z5",
    remarks: "Regular dealer",
    status: "ACTIVE",
    transport: "Shree Maruti Transport",
    bookingCenter: "Narol",
    masterAreaId: "area-surat-central", masterAreaName: "Surat Central",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "dealer-om-enterprise",
    name: "Om Enterprise",
    mobileNumber: "98250 11440",
    alternateMobileNumber: "",
    city: "Rajkot",
    state: "Gujarat",
    gstNumber: "24AAACO9876B1ZX",
    remarks: "",
    status: "ACTIVE",
    transport: "Patel Roadways",
    bookingCenter: "Rajkot Main",
    masterAreaId: "area-surat-central", masterAreaName: "Surat Central",
    createdAt: "2026-08-02T09:00:00.000Z",
    updatedAt: "2026-08-02T09:00:00.000Z",
  },
  {
    id: "dealer-national-traders",
    name: "National Traders",
    mobileNumber: "94280 77881",
    alternateMobileNumber: "",
    city: "Surat",
    state: "Gujarat",
    gstNumber: "24AABCN4567C1Z2",
    remarks: "Account currently inactive",
    status: "INACTIVE",
    transport: "Gujarat Freight",
    bookingCenter: "Sahara Darwaja",
    masterAreaId: "area-surat-central", masterAreaName: "Surat Central",
    createdAt: "2026-08-03T09:00:00.000Z",
    updatedAt: "2026-08-03T09:00:00.000Z",
  },
];

function readDealers(): Dealer[] {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(starterDealers));
    return starterDealers;
  }

  try {
    return JSON.parse(saved) as Dealer[];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(starterDealers));
    return starterDealers;
  }
}

function writeDealers(dealers: Dealer[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dealers));
}

export const localDealerRepository: DealerRepository = {
  async list() {
    return readDealers().sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(id) {
    return readDealers().find((dealer) => dealer.id === id) ?? null;
  },

  async create(input) {
    const now = new Date().toISOString();
    const areaName=JSON.parse(localStorage.getItem("matariya-surat-oms:areas:v1")||"[]").find((a:{id:string})=>a.id===input.masterAreaId)?.name||"Unknown Area";
    const dealer: Dealer = {
      ...input,
      masterAreaName:areaName,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    writeDealers([...readDealers(), dealer]);
    return dealer;
  },

  async update(id, input) {
    const dealers = readDealers();
    const existing = dealers.find((dealer) => dealer.id === id);
    if (!existing) throw new Error("Dealer not found");

    const areaName=JSON.parse(localStorage.getItem("matariya-surat-oms:areas:v1")||"[]").find((a:{id:string})=>a.id===input.masterAreaId)?.name||existing.masterAreaName;
    const updated: Dealer = { ...existing, ...input, masterAreaName:areaName, updatedAt: new Date().toISOString() };
    writeDealers(dealers.map((dealer) => (dealer.id === id ? updated : dealer)));
    return updated;
  },
};
