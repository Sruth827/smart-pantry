import { db } from "./src/lib/db";

async function check() {
    const users = await db.user.findMany();
    console.log("Users in DB:", users);
}
check();