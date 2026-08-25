import type { MasterArea, MasterAreaInput } from "@/types/dealer";
export interface AreaRepository { list(): Promise<MasterArea[]>; create(input: MasterAreaInput): Promise<MasterArea>; update(id: string, input: MasterAreaInput): Promise<MasterArea>; }
