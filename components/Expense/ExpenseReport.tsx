"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Expense, Category, ExpenseType } from "@prisma/client";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

type ExtendedExpense = Expense & {
  category: Category;
  expenseType: ExpenseType;
};

type FilterConfig = {
  startDate: string;
  endDate: string;
  categoryId: string;
  typeId: string;
  minAmount: string;
  maxAmount: string;
  paymentMethod: string;
};

interface ExpenseReportProps {
  onReportGenerated: () => void;
}

export default function ExpenseReport({
  onReportGenerated,
}: ExpenseReportProps) {
  const [filters, setFilters] = useState<FilterConfig>({
    startDate: "",
    endDate: "",
    categoryId: "",
    typeId: "",
    minAmount: "",
    maxAmount: "",
    paymentMethod: "",
  });
  const [expenses, setExpenses] = useState<ExtendedExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [filteredExpenseCount, setFilteredExpenseCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredExpenseCount(filterExpenses(expenses).length);
  }, [filters, expenses]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [expensesResponse, categoriesResponse, expenseTypesResponse] =
        await Promise.all([
          fetch("/api/expenses"),
          fetch("/api/categories"),
          fetch("/api/expense-types"),
        ]);

      const [fetchedExpenses, fetchedCategories, fetchedExpenseTypes] =
        await Promise.all([
          expensesResponse.json(),
          categoriesResponse.json(),
          expenseTypesResponse.json(),
        ]);

      setExpenses(fetchedExpenses);
      setCategories(fetchedCategories.categories);
      setExpenseTypes(fetchedExpenseTypes.expenseTypes);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro",
        description: "Falha ao obter dados. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (name: keyof FilterConfig, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filterExpenses = (expenses: ExtendedExpense[]): ExtendedExpense[] => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      if (filters.startDate && expenseDate < new Date(filters.startDate))
        return false;
      if (filters.endDate && expenseDate > new Date(filters.endDate))
        return false;
      if (
        filters.categoryId &&
        filters.categoryId !== "all" &&
        expense.categoryId !== parseInt(filters.categoryId)
      )
        return false;
      if (
        filters.typeId &&
        filters.typeId !== "all" &&
        expense.typeId !== parseInt(filters.typeId)
      )
        return false;
      if (filters.minAmount && expense.amount < parseFloat(filters.minAmount))
        return false;
      if (filters.maxAmount && expense.amount > parseFloat(filters.maxAmount))
        return false;
      if (
        filters.paymentMethod &&
        filters.paymentMethod !== "all" &&
        expense.PaymentMethod !== filters.paymentMethod
      )
        return false;
      return true;
    });
  };

  const groupByCategory = (expenses: ExtendedExpense[]) => {
    return expenses.reduce((acc, expense) => {
      const categoryName = expense.category?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  const groupByPaymentMethod = (expenses: ExtendedExpense[]) => {
    return expenses.reduce((acc, expense) => {
      const method = expense.PaymentMethod || "Unspecified";
      if (!acc[method]) {
        acc[method] = 0;
      }
      acc[method] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  const groupByTime = (expenses: ExtendedExpense[]) => {
    return expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const month = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  const getTopVendors = (expenses: ExtendedExpense[], limit = 10) => {
    const vendorTotals = expenses.reduce((acc, expense) => {
      const vendor = expense.vendorPayee || "Unspecified";
      if (!acc[vendor]) {
        acc[vendor] = 0;
      }
      acc[vendor] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(vendorTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  };

  const generateExcel = async () => {
    setIsLoading(true);
    const filteredExpenses = filterExpenses(expenses);

    if (filteredExpenses.length === 0) {
      toast({
        title: "Nenhuma despesa encontrada",
        description:
          "Nenhuma despesa corresponde aos filtros selecionados. Ajuste os seus filtros e tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Detailed Expenses Sheet
      const wsExpenses = XLSX.utils.json_to_sheet(
        filteredExpenses.map((e) => ({
          ID: e.id,
          Description: e.description,
          Amount: e.amount,
          Date: formatDate(e.date),
          Category:
            categories.find((c) => c.id === e.categoryId)?.name ??
            "Uncategorized",
          Type:
            expenseTypes.find((t) => t.id === e.typeId)?.name ?? "Unspecified",
          PaymentMethod: e.PaymentMethod ?? "Unspecified",
          VendorPayee: e.vendorPayee ?? "",
          Location: e.expenseLocation ?? "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsExpenses, "Despesas detalhadas");

      // Category Summary
      const categoryData = Object.entries(
        groupByCategory(filteredExpenses)
      ).map(([category, total]) => ({ Category: category, Total: total }));
      const wsCategorySummary = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.sheet_add_aoa(
        wsCategorySummary,
        [["Resumo das despesas por categoria"]],
        { origin: "A1" }
      );
      XLSX.utils.book_append_sheet(
        wb,
        wsCategorySummary,
        "Resumo da categoria"
      );

      // Time-based Analysis
      const timeData = Object.entries(groupByTime(filteredExpenses)).map(
        ([month, total]) => ({ Month: month, Total: total })
      );
      const wsTimeSummary = XLSX.utils.json_to_sheet(timeData);
      XLSX.utils.sheet_add_aoa(
        wsTimeSummary,
        [["Despesas ao longo do tempo"]],
        {
          origin: "A1",
        }
      );
      XLSX.utils.book_append_sheet(wb, wsTimeSummary, "Análise do tempo");

      // Payment Method Analysis
      const paymentData = Object.entries(
        groupByPaymentMethod(filteredExpenses)
      ).map(([method, total]) => ({ Method: method, Total: total }));
      const wsPaymentSummary = XLSX.utils.json_to_sheet(paymentData);
      XLSX.utils.sheet_add_aoa(
        wsPaymentSummary,
        [["Despesas por método de pagamento"]],
        { origin: "A1" }
      );
      XLSX.utils.book_append_sheet(wb, wsPaymentSummary, "Método de pagamento");

      // Top Vendors
      const topVendorsData = getTopVendors(filteredExpenses).map(
        ([vendor, total]) => ({ Vendor: vendor, Total: total })
      );
      const wsTopVendors = XLSX.utils.json_to_sheet(topVendorsData);
      XLSX.utils.sheet_add_aoa(
        wsTopVendors,
        [["Os 10 maiores fornecedores por despesa"]],
        {
          origin: "A1",
        }
      );
      XLSX.utils.book_append_sheet(wb, wsTopVendors, "Principais fornecedores");

      // Summary Statistics
      const totalExpenses = filteredExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );
      const averageExpense = totalExpenses / filteredExpenses.length;
      const summaryData = [
        { Metric: "Total das despesas", Value: totalExpenses },
        { Metric: "Número de despesas", Value: filteredExpenses.length },
        { Metric: "Montante médio das despesas", Value: averageExpense },
      ];
      const wsSummaryStats = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.sheet_add_aoa(wsSummaryStats, [["Estatísticas resumidas"]], {
        origin: "A1",
      });
      XLSX.utils.book_append_sheet(
        wb,
        wsSummaryStats,
        "Resumo das estatísticas"
      );

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `Expense_Report_${new Date()
        .toISOString()
        .replace(/:/g, "-")}.xlsx`;
      const formData = new FormData();
      formData.append("file", blob, fileName);
      formData.append("name", fileName);
      formData.append("description", "Comprehensive expense report");

      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newReport = await response.json();
        toast({
          title: "Relatório gerado e gravado com sucesso!",
          description: `ID do relatório: ${newReport.id}`,
          className: "bg-green-500 text-white",
        });
        onReportGenerated();

        // Open the file URL in a new tab
        window.open(newReport.fileUrl, "_blank");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao gravar o relatório");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Falha ao gerar o relatório",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string | Date | undefined): string => {
    if (typeof date === "string") {
      return date.split("T")[0];
    }
    if (date instanceof Date) {
      return date.toISOString().split("T")[0];
    }
    console.error("Invalid date format:", date);
    return "";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Gerar Relatório</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="startDate">Data de início</Label>
            <Input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDate">Data de fim</Label>
            <Input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={filters.categoryId}
              onValueChange={(value) => handleFilterChange("categoryId", value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={filters.typeId}
              onValueChange={(value) => handleFilterChange("typeId", value)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {expenseTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="minAmount">Montante mínimo</Label>
            <Input
              type="number"
              id="minAmount"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange("minAmount", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="maxAmount">Montante máximo</Label>
            <Input
              type="number"
              id="maxAmount"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Método de pagamento</Label>
            <Select
              value={filters.paymentMethod}
              onValueChange={(value) =>
                handleFilterChange("paymentMethod", value)
              }
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Selecionar o método de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os métodos</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="TRANSFER">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mb-4">
          <p>Despesas de contrapartida: {filteredExpenseCount}</p>
        </div>
        <Button
          onClick={generateExcel}
          className="w-full mb-6 bg-green-500 hover:bg-green-600 hover:text-white hover:shadow-md"
          disabled={isLoading || filteredExpenseCount === 0}
        >
          {isLoading ? "Gerando..." : "Gerar Relatório"}
        </Button>
      </CardContent>
    </Card>
  );
}
