import { database } from "@/server/database";
import { apiError } from "@/server/api-response";
import { authorizationError, requireAdmin, requireUser } from "@/server/authorization";
import type { MasterAreaInput } from "@/types/dealer";
const dto=(v:{id:string;name:string;sortOrder:number;status:"ACTIVE"|"INACTIVE";createdAt:Date;updatedAt:Date})=>({...v,createdAt:v.createdAt.toISOString(),updatedAt:v.updatedAt.toISOString()});
function clean(input:MasterAreaInput){const name=input.name?.trim();if(!name)throw new Error("Master Area name is required.");return {name,sortOrder:Number(input.sortOrder)||0,status:input.status};}
export async function GET(request:Request){try{await requireUser(request.headers);return Response.json((await database.masterArea.findMany({orderBy:[{sortOrder:"asc"},{name:"asc"}]})).map(dto));}catch(e){return authorizationError(e)??apiError(e);}}
export async function POST(request:Request){try{await requireAdmin(request.headers);const {input}=await request.json() as {input:MasterAreaInput};return Response.json(dto(await database.masterArea.create({data:clean(input)})));}catch(e){return authorizationError(e)??apiError(e);}}
export async function PUT(request:Request){try{await requireAdmin(request.headers);const {id,input}=await request.json() as {id:string;input:MasterAreaInput};return Response.json(dto(await database.masterArea.update({where:{id},data:clean(input)})));}catch(e){return authorizationError(e)??apiError(e);}}
