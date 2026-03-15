
import { NextResponse } from 'next/server';
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { sendWelcomeEmail } from "@/lib/mailer";

export async function POST(req: Request) {
    try {
        const { email, fullName, password } = await req.json(); 
    
    if ( !email || !fullName || !password ) {
        return NextResponse.json({error: "Missing field"} , {status: 400});
    }
    
    const existingUser = await db.user.findUnique({
        where: {email}
    });
    if (existingUser) {
        return NextResponse.json({ error: "User already exists"}, { status: 409});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({ 
        data: {
            email,
            fullName,
            passwordHash: hashedPassword,
            categories: {
                create: [
                    { name: 'Produce' },
                    { name: 'Dairy' },
                    { name: 'Pantry Staples' },
                    { name: 'Frozen' },
                    { name: 'Meat' },
                    { name: 'Bakery' },
                ]
            }
        }
    });

    // Send welcome email — fire-and-forget so it never blocks registration
    sendWelcomeEmail(email, fullName).catch((err) =>
      console.error("Welcome email failed:", err)
    );

    return NextResponse.json({ 
        message: "User creation successful",
        userId: newUser.id
    }, {status: 201 });

    } catch (error) {
        console.error("Registration Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}