import { z } from "zod";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const userSchema = z.object({
	id: z.number().optional(),
	fullname: z.string(),
	email: z.string().email(),
	department: z.string(),
	role: z.enum(["ADMIN", "USER"]),
	password: z.string().min(8).optional(),
  });

  type UserUpdateData = Partial<z.infer<typeof userSchema>>;

export async function POST(req: Request) {
	try {
	  const body = await req.json();
	  const { fullname, email, department, role, password } = userSchema.parse(body);
  
	  const hashedPassword = await hash(password!, 10);
  
	  const user = await prisma.user.create({
		data: {
		  fullname,
		  email,
		  department,
		  role,
		  password: hashedPassword,
		},
	  });
  
	  // eslint-disable-next-line @typescript-eslint/no-unused-vars
	  const { password: _, ...userWithoutPassword } = user;
	  // eslint-disable-next-line @typescript-eslint/no-unused-vars
	  return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
	} catch (error) {
	  console.error("Error creating user:", error);
	  return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
	}
  }
  
  export async function PUT(req: Request) {
	try {
	  const body = await req.json();
	  const { id, fullname, email, department, role, password } = userSchema.parse(body);
  
	  if (!id) {
		return NextResponse.json({ error: "User ID is required for update" }, { status: 400 });
	  }
  
	  const updateData: UserUpdateData = {
		fullname,
		email,
		department,
		role,
	  };
  
	  if (password) {
		updateData.password = await hash(password, 10);
	  }
  
	  const user = await prisma.user.update({
		where: { id },
		data: updateData,
	  });
  
	  // eslint-disable-next-line @typescript-eslint/no-unused-vars
	  const { password: _, ...userWithoutPassword } = user;
	  // eslint-disable-next-line @typescript-eslint/no-unused-vars
	  return NextResponse.json({ user: userWithoutPassword }, { status: 200 });
	} catch (error) {
	  console.error("Error updating user:", error);
	  if (error instanceof z.ZodError) {
		return NextResponse.json({ error: error.errors }, { status: 400 });
	  }
	  return NextResponse.json({ error: "Failed to update user" }, { status: 400 });
	}
  }
  
  export async function GET() {
	const users = await prisma.user.findMany({
	  select: {
		id: true,
		fullname: true,
		email: true,
		department: true,
		role: true,
	  },
	});
  
	return NextResponse.json({ users }, { status: 200 });
  }
