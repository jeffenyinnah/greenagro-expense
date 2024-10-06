import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { writeFile } from 'fs/promises';
import path from 'path';

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.string().transform(Number),
  date: z.string().transform(str => new Date(str).toISOString()),
  categoryId: z.string().transform(Number),
  typeId: z.string().transform(Number),
  PaymentMethod: z.enum(["CASH", "TRANSFER"]),
  vendorPayee: z.string(),
  expenseLocation: z.string(),
});

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany();
    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('receiptUpload') as File | null;
    
    const validatedData = expenseSchema.parse(Object.fromEntries(formData));
    
    let receiptUploadUrl = '';
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const uint8Array = new Uint8Array(bytes);
      
      // Save the file
      const filename = `${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await writeFile(path.join(uploadDir, filename), uint8Array);
      
      // Generate URL for the file
      receiptUploadUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/uploads/${filename}`;
    }
    
    const expenseData = {
      ...validatedData,
      ...(receiptUploadUrl && { receiptUpload: receiptUploadUrl }),
    };
    
    const expense = await prisma.expense.create({
      data: expenseData,
    });
    
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid expense data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
