"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const nigerianGreen = "#008751";
const nigerianWhite = "#FFFFFF";
const nigerianBlack = "#000000";

// Define a broader color palette for the pie chart
const colorPalette = [
  "#008751", // Nigerian Green
  "#FF6B6B", // Pastel Red
  "#4ECDC4", // Turquoise
  "#45B7D1", // Sky Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Maize
  "#BB8FCE", // Light Purple
  "#F1948A", // Light Coral
  "#85C1E9", // Light Blue
];

interface DashboardData {
  totalExpenses: number;
  totalCategories: number;
  totalVouchers: number;
  expenseData: { name: string; value: number }[];
  monthlyTrendData: { name: string; value: number }[];
  expenseTypeData: { name: string; value: number }[];
  recentExpenses: {
    id: number;
    category: string;
    amount: number;
    date: string;
  }[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [months, setMonths] = useState<string[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchDashboardData(selectedMonth);
    }
  }, [selectedMonth]);

  const fetchAvailableMonths = async () => {
    try {
      const response = await fetch("/api/expenses/months");
      if (!response.ok) throw new Error("Failed to fetch months");
      const data = await response.json();
      setMonths(data.months);
      if (data.months.length > 0) {
        setSelectedMonth(data.months[0]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch available months",
        variant: "destructive",
      });
    }
  };

  const fetchDashboardData = async (month: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard?month=${month}`);
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const handleGenerateReport = () => {
    router.push("/reports");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-gray-600">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-red-600">
        Access Denied
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-gray-600">
        No data available
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Welcome {session?.user.email} to Expense Analytics Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[250px] bg-white text-gray-800 border-gray-300">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month} className="text-gray-800">
                  {formatMonth(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleGenerateReport}
          >
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white shadow-lg rounded-lg border-green-600 border-t-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              MZN{dashboardData.totalExpenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg rounded-lg border-green-600 border-t-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {dashboardData.totalCategories}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg rounded-lg border-green-600 border-t-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Total Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {dashboardData.totalVouchers}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="bg-white shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.expenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" tick={{ fill: nigerianBlack }} />
                <YAxis tick={{ fill: nigerianBlack }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: nigerianWhite,
                    color: nigerianBlack,
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill={nigerianGreen} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Weekly Expense Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" tick={{ fill: nigerianBlack }} />
                <YAxis tick={{ fill: nigerianBlack }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: nigerianWhite,
                    color: nigerianBlack,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={nigerianGreen}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Expense Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.expenseTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {dashboardData.expenseTypeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colorPalette[index % colorPalette.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: nigerianWhite,
                    color: nigerianBlack,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-700">Category</TableHead>
                    <TableHead className="text-gray-700">
                      Amount (MZN)
                    </TableHead>
                    <TableHead className="text-gray-700">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recentExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.category}
                      </TableCell>
                      <TableCell>{expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
