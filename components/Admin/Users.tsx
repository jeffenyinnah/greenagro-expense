"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

const userSchema = z.object({
  id: z.number().optional(),
  fullname: z.string().min(1, "Name is required"),
  email: z.string().email("Endereço eletrónico inválido"),
  department: z.string().min(1, "O departamento é obrigatório"),
  role: z.enum(["ADMIN", "USER"]),
  password: z
    .string()
    .min(8, "PA palavra-passe deve ter pelo menos 8 caracteres")
    .optional(),
});

type User = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: editingUser || {},
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/auth/register");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro",
        description: "Falha na obtenção de usuários",
        className: "bg-red-500",
        duration: 2000,
      });
    }
  };

  const onSubmit = async (data: User) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: editingUser ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar o usuário");
      }

      await fetchUsers();
      toast({
        title: editingUser ? "Usuário atualizado" : "Usuário criado",
        description: `User has been ${
          editingUser ? "atualizado" : "criado"
        } com sucesso`,
        className: editingUser ? "bg-green-600" : "bg-green-500",
        duration: 2000,
      });
      setIsDialogOpen(false);
      setEditingUser(null);
      reset();
    } catch (error) {
      console.error("Error updating/creating user:", error);
      toast({
        title: "Erro",
        description: "Falha na atualização/criação do usuário",
        className: "bg-red-500",
        duration: 2000,
      });
    }
  };

  const handleOpenDialog = () => {
    setEditingUser(null);
    reset({});
    setIsDialogOpen(true);
  };

  // const handleCloseDialog = () => {
  //   setEditingUser(null);
  //   reset({});
  //   setIsDialogOpen(false);
  // };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    reset({
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      department: user.department,
      role: user.role,
      password: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/auth/register/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      await fetchUsers();
      toast({
        title: "Usuário apagado",
        description: "O usuário foi apagado com sucesso",
        className: "bg-red-500",
        duration: 2000,
      });
    } catch (error) {
      console.error("Erro ao apagar o usuário:", error);
      toast({
        title: "Erro",
        description: "Erro ao apagar o usuário",
        className: "bg-red-500",
        duration: 2000,
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Usuários</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleOpenDialog}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-green-600">
                {editingUser ? "Edit User" : "Add New User"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="fullname" className="text-black">
                  Nome completo
                </Label>
                <Input
                  id="fullname"
                  {...register("fullname")}
                  className="text-black"
                />
                {errors.fullname && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.fullname.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email" className="text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="text-black"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="password" className="text-black">
                  Palavra-passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="text-black"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="department" className="text-black">
                  Departmento
                </Label>
                <Input
                  id="department"
                  {...register("department")}
                  className="text-black"
                />
                {errors.department && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.department.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="role" className="text-black">
                  Função
                </Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="text-black">
                        <SelectValue placeholder="Selecionar função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="USER">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {editingUser ? "Atualizar usuário" : "Criar usuário"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Nome completo</TableHead>
                <TableHead className="w-[200px]">Email</TableHead>
                <TableHead>Departmento</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullname}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
