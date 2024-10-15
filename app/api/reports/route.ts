import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!file || !name) {
      return NextResponse.json({ error: 'File and name are required' }, { status: 400 });
    }

    // Upload to Vercel Blob Storage
    const { url } = await put(name, file, {
      access: 'public',
    });

    const newReport = await prisma.report.create({
      data: {
        name,
        description,
        fileUrl: url,
      },
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reports:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error in GET /api/reports:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}