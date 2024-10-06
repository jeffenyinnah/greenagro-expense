import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    // First, check if there are any expenses associated with this category
    const expenseCount = await prisma.expense.count({
      where: { categoryId: parseInt(id, 10) },
    });

    if (expenseCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category. It has associated expenses." },
        { status: 400 }
      );
    }

    // If no associated expenses, proceed with deletion
    const category = await prisma.category.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the category." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { name } = await req.json();

  try {
    const category = await prisma.category.update({
      where: { id: parseInt(id, 10) },
      data: { name },
    });

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the category." },
      { status: 500 }
    );
  }
}