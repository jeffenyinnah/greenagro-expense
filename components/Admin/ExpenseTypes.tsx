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
import { Pencil, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const expenseTypeSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
});

type ExpenseType = z.infer<typeof expenseTypeSchema>;

export default function ExpenseTypesComponent() {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpenseType, setEditingExpenseType] =
    useState<ExpenseType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenseTypes();
  }, []);

  const fetchExpenseTypes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/expense-types");
      if (!response.ok) {
        throw new Error("Failed to fetch expense types");
      }
      const data = await response.json();
      setExpenseTypes(data.expenseTypes);
    } catch (error) {
      console.error("Error fetching expense types:", error);
      toast({
        title: "Erro",
        description:
          "Falha ao obter os tipos de despesas. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;

    const method = editingExpenseType ? "PUT" : "POST";
    const url = editingExpenseType
      ? `/api/expense-types/${editingExpenseType.id}`
      : "/api/expense-types";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Falha ao gravar o tipo de despesa");
      }

      const { expenseType: savedExpenseType } = await response.json();

      if (editingExpenseType) {
        setExpenseTypes(
          expenseTypes.map((type) =>
            type.id === savedExpenseType.id ? savedExpenseType : type
          )
        );
        toast({
          title: "Sucesso",
          description: "Tipo de despesa atualizado com sucesso",
          variant: "default",
          className: "bg-green-600 text-white",
        });
      } else {
        setExpenseTypes([...expenseTypes, savedExpenseType]);
        toast({
          title: "Sucesso",
          description: "Novo tipo de despesa adicionado com sucesso",
          variant: "default",
          className: "bg-green-600 text-white",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description:
          "Falha ao gravar o tipo de despesa. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDialogOpen(false);
      setEditingExpenseType(null);
    }
  };

  const handleEdit = (expenseType: ExpenseType) => {
    setEditingExpenseType(expenseType);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/expense-types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Falha ao apagar o tipo de despesa");
      }

      setExpenseTypes(expenseTypes.filter((type) => type.id !== id));
      toast({
        title: "Sucesso",
        description: "Tipo de despesa apagado com sucesso",
        variant: "default",
        className: "bg-green-600 text-white",
      });
    } catch (error) {
      console.error("Error deleting expense type:", error);
      toast({
        title: "Erro",
        description: "Falha ao apagar o tipo de despesa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Tipos de despesas</CardTitle>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingExpenseType(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" /> Adicionar tipo de despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-green-600">
                {editingExpenseType
                  ? "Editar tipo de despesa"
                  : "Adicionar novo tipo de despesa"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-black">
                  Nome do tipo de despesa
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingExpenseType?.name}
                  required
                  className="text-black"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {editingExpenseType
                  ? "Atualizar tipo de despesas"
                  : "Criar tipo de despesa"}
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
                <TableHead className="w-[250px]">
                  Nome do tipo de despesa
                </TableHead>
                <TableHead className="text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Obter tipos de despesas...
                  </TableCell>
                </TableRow>
              ) : expenseTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Não foram encontrados tipos de despesas. Por favor, adicione
                    um.
                  </TableCell>
                </TableRow>
              ) : (
                expenseTypes.map((expenseType) => (
                  <TableRow key={expenseType.id}>
                    <TableCell className="font-medium">
                      {expenseType.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(expenseType)}
                        className="mr-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(expenseType.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
