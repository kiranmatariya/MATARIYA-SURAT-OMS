import { database } from "@/server/database";
import { apiError } from "@/server/api-response";
import { authorizationError, requireUser } from "@/server/authorization";
import type { DealerInput } from "@/types/dealer";

type DealerRow = Awaited<ReturnType<typeof database.dealer.findFirstOrThrow>> & { masterArea: { name: string } };
const dto = (value: DealerRow) => ({ ...value, masterAreaName:value.masterArea.name, masterArea:undefined, createdAt: value.createdAt.toISOString(), updatedAt: value.updatedAt.toISOString() });
function clean(input: DealerInput) { if (!input.name?.trim()) throw new Error("Dealer Name is required."); if(!input.masterAreaId)throw new Error("Master Area is required."); return { ...input, name: input.name.trim() }; }
export async function GET(request: Request) { try { await requireUser(request.headers); const id = new URL(request.url).searchParams.get("id"); if (id) { const value = await database.dealer.findUnique({ where: { id },include:{masterArea:true} }); return Response.json(value ? dto(value) : null); } return Response.json((await database.dealer.findMany({ include:{masterArea:true},orderBy: { name: "asc" } })).map(dto)); } catch (e) { return authorizationError(e) ?? apiError(e); } }
export async function POST(request: Request) { try { await requireUser(request.headers); const { input } = await request.json() as { input: DealerInput }; const created=await database.dealer.create({ data: clean(input) }); return Response.json(dto((await database.dealer.findUniqueOrThrow({where:{id:created.id},include:{masterArea:true}})))); } catch (e) { return authorizationError(e) ?? apiError(e); } }
export async function PUT(request: Request) { try { await requireUser(request.headers); const { id, input } = await request.json() as { id: string; input: DealerInput }; await database.dealer.update({ where: { id }, data: clean(input) }); return Response.json(dto(await database.dealer.findUniqueOrThrow({where:{id},include:{masterArea:true}}))); } catch (e) { return authorizationError(e) ?? apiError(e); } }
