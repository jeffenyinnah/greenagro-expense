import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const expenseTypeSchema = z.object({
	name: z.string(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const expenseType = await prisma.expenseType.findUnique({
        where: { id: Number(params.id)  },
    });
    return NextResponse.json({ expenseType }, { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
	const body = await req.json();
	const { name } = expenseTypeSchema.parse(body);

	const expenseType = await prisma.expenseType.update({
        where: { id: parseInt(id, 10) },
        data: { name },
    });
    return NextResponse.json({ expenseType }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
	const { id } = params;

	const expenseType = await prisma.expenseType.delete({
		where: { id: parseInt(id, 10) },
	});
	return NextResponse.json({ expenseType }, { status: 200 });
}
