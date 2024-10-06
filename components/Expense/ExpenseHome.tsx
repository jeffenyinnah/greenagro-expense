"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ExpenseList from "./ExpenseList";
import ExpenseForm, { ExpenseFormData } from "./ExpenseForm";
import ExpenseFilter from "./ExpenseFilter";
import { Expense, FilterConfig, Category, ExpenseType } from "@/types/Props";
import { useToast } from "@/hooks/use-toast";

type SortableExpenseKey = keyof Pick<
  Expense,
  | "description"
  | "amount"
  | "date"
  | "categoryId"
  | "typeId"
  | "PaymentMethod"
  | "vendorPayee"
  | "expenseLocation"
>;

type SortConfig = {
  key: SortableExpenseKey;
  direction: "ascending" | "descending";
};

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(
    undefined
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "date",
    direction: "ascending",
  });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    categoryId: "",
    typeId: "",
    paymentMethod: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [expensesResponse, categoriesResponse, expenseTypesResponse] =
          await Promise.all([
            fetch("/api/expenses"),
            fetch("/api/categories"),
            fetch("/api/expense-types"),
          ]);

        if (
          !expensesResponse.ok ||
          !categoriesResponse.ok ||
          !expenseTypesResponse.ok
        ) {
          throw new Error("Failed to fetch data");
        }

        const expensesData = await expensesResponse.json();
        const categoriesData = await categoriesResponse.json();
        const expenseTypesData = await expenseTypesResponse.json();

        setExpenses(expensesData);
        setFilteredExpenses(expensesData);
        setCategories(categoriesData.categories);
        setExpenseTypes(expenseTypesData.expenseTypes);
      } catch (err) {
        setError("Error fetching data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!Array.isArray(expenses)) {
      setFilteredExpenses([]);
      return;
    }

    let result = [...expenses];

    // Apply search
    if (searchTerm) {
      result = result.filter(
        (exp) =>
          exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.vendorPayee.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.expenseLocation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filterConfig.startDate) {
      result = result.filter((exp) => exp.date >= filterConfig.startDate);
    }
    if (filterConfig.endDate) {
      result = result.filter((exp) => exp.date <= filterConfig.endDate);
    }
    if (filterConfig.minAmount) {
      result = result.filter(
        (exp) => exp.amount >= Number(filterConfig.minAmount)
      );
    }
    if (filterConfig.maxAmount) {
      result = result.filter(
        (exp) => exp.amount <= Number(filterConfig.maxAmount)
      );
    }
    if (filterConfig.categoryId) {
      result = result.filter(
        (exp) => exp.categoryId === parseInt(filterConfig.categoryId)
      );
    }
    if (filterConfig.typeId) {
      result = result.filter(
        (exp) => exp.typeId === parseInt(filterConfig.typeId)
      );
    }
    if (filterConfig.paymentMethod) {
      result = result.filter(
        (exp) => exp.PaymentMethod === filterConfig.paymentMethod
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });

    setFilteredExpenses(result);
  }, [expenses, sortConfig, filterConfig, searchTerm]);

  const handleAddExpense = async (
    newExpense: ExpenseFormData,
    file: File | null
  ) => {
    try {
      const formData = new FormData();

      // Append all fields from newExpense
      Object.entries(newExpense).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // Append file if it exists
      if (file) {
        formData.append("receiptUpload", file);
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add expense");
      }

      const addedExpense = await response.json();
      setExpenses((prevExpenses) => [...prevExpenses, addedExpense]);
      setFilteredExpenses((prevFiltered) => [...prevFiltered, addedExpense]);
      setIsDialogOpen(false);
      setError(null);
      toast({
        title: "Expense Added",
        description: "Your expense was successfully added.",
        className: "bg-green-500 text-white",
      });
    } catch (err) {
      console.error("Error adding expense:", err);
      toast({
        title: "Expense not Added",
        description: "Error adding expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateExpense = async (
    updatedExpense: ExpenseFormData,
    file: File | null
  ) => {
    if (updatedExpense.id === undefined) {
      console.error("Cannot update expense without an id");
      setError("Invalid expense data: missing id");
      return;
    }
    try {
      const formData = new FormData();

      // Ensure all fields are properly formatted
      Object.entries(updatedExpense).forEach(([key, value]) => {
        if (key === "amount") {
          formData.append(key, value.toString());
        } else if (key === "categoryId" || key === "typeId") {
          formData.append(key, parseInt(value as string).toString());
        } else {
          formData.append(key, value as string);
        }
      });

      if (file) {
        formData.append("receiptUpload", file);
      }

      const response = await fetch(`/api/expenses/${updatedExpense.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update expense");
      }

      const updatedExpenseData = await response.json();

      setExpenses((prevExpenses) =>
        prevExpenses.map((exp) =>
          exp.id === updatedExpenseData.id ? updatedExpenseData : exp
        )
      );
      setFilteredExpenses((prevFiltered) =>
        prevFiltered.map((exp) =>
          exp.id === updatedExpenseData.id ? updatedExpenseData : exp
        )
      );

      setIsDialogOpen(false);
      setEditingExpense(undefined);
      toast({
        title: "Expense Updated",
        description: "Your expense was successfully Updated.",
        className: "bg-green-500 text-white",
      });
    } catch (err) {
      console.error("Error updating expense:", err);
      toast({
        title: "Error occured",
        description: "Error updating expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      setExpenses((prevExpenses) =>
        prevExpenses.filter((exp) => exp.id !== id)
      );
      setFilteredExpenses((prevFiltered) =>
        prevFiltered.filter((exp) => exp.id !== id)
      );
      toast({
        title: "Expense Deleted",
        description: "Your expense was successfully Deleted.",
        variant: "destructive",
      });
    } catch (err) {
      toast({
        title: "Error occured",
        description: "Error deleting expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleSort = (key: SortableExpenseKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleFilter = (newFilterConfig: FilterConfig) => {
    setFilterConfig(newFilterConfig);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Expense Management</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setEditingExpense(undefined);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-white">
            <ExpenseForm
              onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
              expense={editingExpense}
              categories={categories}
              expenseTypes={expenseTypes}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <ExpenseFilter
          categories={categories}
          expenseTypes={expenseTypes}
          onFilterChange={handleFilter}
        />
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <ExpenseList
          expenses={filteredExpenses}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          onSort={handleSort}
          sortConfig={sortConfig}
          categories={categories}
          expenseTypes={expenseTypes}
        />
      </CardContent>
    </Card>
  );
}
