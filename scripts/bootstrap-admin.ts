import { config } from "dotenv";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { postgresAdapter } from "../src/server/postgres-adapter";
import { randomUUID } from "node:crypto";

config({ path: [".env.local", ".env"] });

const required=["DATABASE_URL","FIRST_ADMIN_NAME","FIRST_ADMIN_EMAIL","FIRST_ADMIN_USERNAME","FIRST_ADMIN_PASSWORD"] as const;
for(const key of required)if(!process.env[key])throw new Error(`${key} is required.`);
if(process.env.FIRST_ADMIN_PASSWORD!.length<8)throw new Error("FIRST_ADMIN_PASSWORD must contain at least 8 characters.");
const database=new PrismaClient({adapter:postgresAdapter(process.env.DATABASE_URL!)});
try{
  if(await database.user.count({where:{role:"ADMIN"}}))throw new Error("An administrator already exists. Use Settings → Users instead.");
  const password=await hashPassword(process.env.FIRST_ADMIN_PASSWORD!);
  const email=process.env.FIRST_ADMIN_EMAIL!.toLowerCase();
  const id=randomUUID();
  const user=await database.user.create({data:{id,name:process.env.FIRST_ADMIN_NAME!,email,username:process.env.FIRST_ADMIN_USERNAME!.toLowerCase(),displayUsername:process.env.FIRST_ADMIN_USERNAME!,role:"ADMIN",accounts:{create:{providerId:"credential",accountId:id,password}}}});
  console.log(`First administrator created: ${user.email}`);
}finally{await database.$disconnect();}
