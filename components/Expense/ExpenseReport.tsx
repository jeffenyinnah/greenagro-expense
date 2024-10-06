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
import {
  PrismaClient,
  Expense,
  Category,
  ExpenseType,
  PaymentMethod,
} from "@prisma/client";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

const prisma = new PrismaClient();

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
  // const [currencies, setCurrencies] = useState<Currency[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fetchedExpenses, fetchedCategories, fetchedExpenseTypes] =
        await Promise.all([
          prisma.expense.findMany(),
          prisma.category.findMany(),
          prisma.expenseType.findMany(),
          prisma.currency.findMany(),
        ]);

      const extendedExpenses: ExtendedExpense[] = fetchedExpenses.map(
        (expense) => ({
          ...expense,
          category: fetchedCategories.find(
            (c) => c.id === expense.categoryId
          ) || {
            id: 0,
            name: "Unknown",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          expenseType: fetchedExpenseTypes.find(
            (t) => t.id === expense.typeId
          ) || {
            id: 0,
            name: "Unknown",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      );

      setExpenses(extendedExpenses);
      setCategories(fetchedCategories);
      setExpenseTypes(fetchedExpenseTypes);
      // setCurrencies(fetchedCurrencies);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle the error appropriately (e.g., show an error message to the user)
    }
  };

  const handleFilterChange = (name: keyof FilterConfig, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filterExpenses = (expenses: ExtendedExpense[]): ExtendedExpense[] => {
    return expenses.filter((expense) => {
      if (filters.startDate && expense.date < new Date(filters.startDate))
        return false;
      if (filters.endDate && expense.date > new Date(filters.endDate))
        return false;
      if (
        filters.categoryId &&
        expense.categoryId !== parseInt(filters.categoryId)
      )
        return false;
      if (filters.typeId && expense.typeId !== parseInt(filters.typeId))
        return false;
      if (filters.minAmount && expense.amount < parseFloat(filters.minAmount))
        return false;
      if (filters.maxAmount && expense.amount > parseFloat(filters.maxAmount))
        return false;
      if (
        filters.paymentMethod &&
        expense.PaymentMethod !== (filters.paymentMethod as PaymentMethod)
      )
        return false;
      return true;
    });
  };

  const groupByCategory = (expenses: ExtendedExpense[]) => {
    return expenses.reduce((acc, expense) => {
      const categoryName = expense.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  const groupByPaymentMethod = (expenses: ExtendedExpense[]) => {
    return expenses.reduce((acc, expense) => {
      if (!acc[expense.PaymentMethod]) {
        acc[expense.PaymentMethod] = 0;
      }
      acc[expense.PaymentMethod] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  const groupByTime = (expenses: ExtendedExpense[]) => {
    return expenses.reduce((acc, expense) => {
      const month = expense.date.toLocaleString("default", {
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
      if (!acc[expense.vendorPayee]) {
        acc[expense.vendorPayee] = 0;
      }
      acc[expense.vendorPayee] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(vendorTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  };

  const generateExcel = async () => {
    const filteredExpenses = filterExpenses(expenses);

    if (filteredExpenses.length === 0) {
      toast({
        title: "No Expenses found",
        description:
          "No expenses found for the selected filters. Please adjust your filters and try again.",
        variant: "destructive",
      });

      return;
    }

    const wb = XLSX.utils.book_new();

    // Detailed Expenses Sheet
    const wsExpenses = XLSX.utils.json_to_sheet(
      filteredExpenses.map((e) => ({
        ID: e.id,
        Description: e.description,
        Amount: e.amount,
        Date: e.date.toISOString().split("T")[0],
        Category: e.category.name,
        Type: e.expenseType.name,
        PaymentMethod: e.PaymentMethod,
        VendorPayee: e.vendorPayee,
        Location: e.expenseLocation,
      }))
    );
    XLSX.utils.book_append_sheet(wb, wsExpenses, "Detailed Expenses");

    // Category Summary
    const categoryData = Object.entries(groupByCategory(filteredExpenses)).map(
      ([category, total]) => ({ Category: category, Total: total })
    );
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

    // XLSX.writeFile(wb, "Comprehensive_Expense_Report.xlsx");

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

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Report generated and saved successfully!",
          className: "bg-green-500 text-white",
        });
        onReportGenerated();

        // Trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save the report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Failed to save the report. Please try again!",
        className: "bg-red-500 text-white",
      });
    }
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
                {categories.map((category) => (
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
        <Button
          onClick={generateExcel}
          className="w-full mb-6 bg-green-500 hover:bg-green-600 hover:text-white hover:shadow-md"
        >
          Generate Comprehensive Excel Report
        </Button>
      </CardContent>
    </Card>
  );
}
