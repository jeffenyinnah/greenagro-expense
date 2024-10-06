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
        title: "Error",
        description: "Failed to fetch expense types. Please try again.",
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
        throw new Error("Failed to save expense type");
      }

      const { expenseType: savedExpenseType } = await response.json();

      if (editingExpenseType) {
        setExpenseTypes(
          expenseTypes.map((type) =>
            type.id === savedExpenseType.id ? savedExpenseType : type
          )
        );
        toast({
          title: "Success",
          description: "Expense type updated successfully",
          variant: "default",
          className: "bg-green-600 text-white",
        });
      } else {
        setExpenseTypes([...expenseTypes, savedExpenseType]);
        toast({
          title: "Success",
          description: "New expense type added successfully",
          variant: "default",
          className: "bg-green-600 text-white",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save expense type. Please try again.",
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
        throw new Error("Failed to delete expense type");
      }

      setExpenseTypes(expenseTypes.filter((type) => type.id !== id));
      toast({
        title: "Success",
        description: "Expense type deleted successfully",
        variant: "default",
        className: "bg-green-600 text-white",
      });
    } catch (error) {
      console.error("Error deleting expense type:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense type. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Expense Types</CardTitle>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingExpenseType(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" /> Add Expense Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-green-600">
                {editingExpenseType
                  ? "Edit Expense Type"
                  : "Add New Expense Type"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-black">
                  Expense Type Name
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
                  ? "Update Expense Type"
                  : "Create Expense Type"}
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
                <TableHead className="w-[250px]">Expense Type Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Fetching expense types...
                  </TableCell>
                </TableRow>
              ) : expenseTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    No expense types found. Please add one.
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
