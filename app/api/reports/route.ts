// app/api/reports/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const filePath = path.join(process.cwd(), 'public', 'reports', name);
  
  await writeFile(filePath, new Uint8Array(bytes));

  const fileUrl = `/reports/${name}`;

  const newReport = await prisma.report.create({
    data: { name, description, fileUrl },
  });

  return NextResponse.json(newReport, { status: 201 });
}

export async function GET() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(reports);
}