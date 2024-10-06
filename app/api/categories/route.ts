import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const categorySchema = z.object({
	id: z.number().optional(),
	name: z.string(),
});


export async function POST(req: NextRequest) {
	const body = await req.json();
	const { name } = categorySchema.parse(body);
  
	const category = await prisma.category.create({
	  data: { name },
	});
  
	return NextResponse.json({ category }, { status: 201 });
  }

export async function GET() {
	const categories = await prisma.category.findMany();
	return NextResponse.json({ categories }, { status: 200 });
}
