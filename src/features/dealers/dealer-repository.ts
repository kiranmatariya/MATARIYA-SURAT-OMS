import type { Dealer, DealerInput } from "@/types/dealer";

export interface DealerRepository {
  list(): Promise<Dealer[]>;
  getById(id: string): Promise<Dealer | null>;
  create(input: DealerInput): Promise<Dealer>;
  update(id: string, input: DealerInput): Promise<Dealer>;
}
