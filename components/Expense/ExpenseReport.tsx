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
        title: "Error",
        description: "Failed to fetch data. Please try again.",
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
        title: "No Expenses Found",
        description:
          "No expenses match the selected filters. Please adjust your filters and try again.",
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
      XLSX.utils.book_append_sheet(wb, wsExpenses, "Detailed Expenses");

      // Category Summary
      const categoryData = Object.entries(
        groupByCategory(filteredExpenses)
      ).map(([category, total]) => ({ Category: category, Total: total }));
      const wsCategorySummary = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.sheet_add_aoa(
        wsCategorySummary,
        [["Expense Summary by Category"]],
        { origin: "A1" }
      );
      XLSX.utils.book_append_sheet(wb, wsCategorySummary, "Category Summary");

      // Time-based Analysis
      const timeData = Object.entries(groupByTime(filteredExpenses)).map(
        ([month, total]) => ({ Month: month, Total: total })
      );
      const wsTimeSummary = XLSX.utils.json_to_sheet(timeData);
      XLSX.utils.sheet_add_aoa(wsTimeSummary, [["Expenses Over Time"]], {
        origin: "A1",
      });
      XLSX.utils.book_append_sheet(wb, wsTimeSummary, "Time Analysis");

      // Payment Method Analysis
      const paymentData = Object.entries(
        groupByPaymentMethod(filteredExpenses)
      ).map(([method, total]) => ({ Method: method, Total: total }));
      const wsPaymentSummary = XLSX.utils.json_to_sheet(paymentData);
      XLSX.utils.sheet_add_aoa(
        wsPaymentSummary,
        [["Expenses by Payment Method"]],
        { origin: "A1" }
      );
      XLSX.utils.book_append_sheet(wb, wsPaymentSummary, "Payment Method");

      // Top Vendors
      const topVendorsData = getTopVendors(filteredExpenses).map(
        ([vendor, total]) => ({ Vendor: vendor, Total: total })
      );
      const wsTopVendors = XLSX.utils.json_to_sheet(topVendorsData);
      XLSX.utils.sheet_add_aoa(wsTopVendors, [["Top 10 Vendors by Expense"]], {
        origin: "A1",
      });
      XLSX.utils.book_append_sheet(wb, wsTopVendors, "Top Vendors");

      // Summary Statistics
      const totalExpenses = filteredExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );
      const averageExpense = totalExpenses / filteredExpenses.length;
      const summaryData = [
        { Metric: "Total Expenses", Value: totalExpenses },
        { Metric: "Number of Expenses", Value: filteredExpenses.length },
        { Metric: "Average Expense Amount", Value: averageExpense },
      ];
      const wsSummaryStats = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.sheet_add_aoa(wsSummaryStats, [["Summary Statistics"]], {
        origin: "A1",
      });
      XLSX.utils.book_append_sheet(wb, wsSummaryStats, "Summary Stats");

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
          title: "Report generated and saved successfully!",
          description: `Report ID: ${newReport.id}`,
          className: "bg-green-500 text-white",
        });
        onReportGenerated();

        // Open the file URL in a new tab
        window.open(newReport.fileUrl, "_blank");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save the report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Failed to generate the report",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
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
        <CardTitle className="text-2xl font-bold">
          Generate Comprehensive Expense Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={filters.categoryId}
              onValueChange={(value) => handleFilterChange("categoryId", value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={filters.typeId}
              onValueChange={(value) => handleFilterChange("typeId", value)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {expenseTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="minAmount">Min Amount</Label>
            <Input
              type="number"
              id="minAmount"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange("minAmount", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="maxAmount">Max Amount</Label>
            <Input
              type="number"
              id="maxAmount"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={filters.paymentMethod}
              onValueChange={(value) =>
                handleFilterChange("paymentMethod", value)
              }
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mb-4">
          <p>Matching expenses: {filteredExpenseCount}</p>
        </div>
        <Button
          onClick={generateExcel}
          className="w-full mb-6 bg-green-500 hover:bg-green-600 hover:text-white hover:shadow-md"
          disabled={isLoading || filteredExpenseCount === 0}
        >
          {isLoading ? "Generating..." : "Generate Comprehensive Excel Report"}
        </Button>
      </CardContent>
    </Card>
  );
}
