import * as dotenv from "dotenv";
dotenv.config({ path: "app/.env" });

import { db } from "./app/src/lib/db";
import { chatMessages } from "./app/src/lib/db/schema";

async function check() {
    const msgs = await db.select().from(chatMessages);
    console.log(JSON.stringify(msgs, null, 2));
}

check();
