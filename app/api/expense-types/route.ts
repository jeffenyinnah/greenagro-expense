import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";


const expenseTypeSchema = z.object({
	name: z.string(),
});

export async function GET() {
	const expenseTypes = await prisma.expenseType.findMany();
	return NextResponse.json({ expenseTypes }, { status: 200 });
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { name } = expenseTypeSchema.parse(body);

		const expenseType = await prisma.expenseType.create({
			data: { name },
		});
		return NextResponse.json({ expenseType }, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
	}
}
