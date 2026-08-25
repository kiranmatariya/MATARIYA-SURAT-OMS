import type { MasterArea } from "@/types/dealer";
import type { AreaRepository } from "./area-repository";
const KEY = "matariya-surat-oms:areas:v1";
const starter: MasterArea[] = [{ id: "area-surat-central", name: "Surat Central", sortOrder: 1, status: "ACTIVE", createdAt: "2026-08-23T00:00:00.000Z", updatedAt: "2026-08-23T00:00:00.000Z" }];
function read() { const value = localStorage.getItem(KEY); if (!value) { localStorage.setItem(KEY, JSON.stringify(starter)); return starter; } try { return JSON.parse(value) as MasterArea[]; } catch { return starter; } }
function write(value: MasterArea[]) { localStorage.setItem(KEY, JSON.stringify(value)); }
export const localAreaRepository: AreaRepository = {
  async list() { return read().sort((a,b) => a.sortOrder-b.sortOrder || a.name.localeCompare(b.name)); },
  async create(input) { const now=new Date().toISOString(); const value={...input,id:crypto.randomUUID(),createdAt:now,updatedAt:now}; write([...read(),value]); return value; },
  async update(id,input) { const values=read(), old=values.find(v=>v.id===id); if(!old) throw new Error("Master Area not found"); const value={...old,...input,updatedAt:new Date().toISOString()}; write(values.map(v=>v.id===id?value:v)); return value; },
};
