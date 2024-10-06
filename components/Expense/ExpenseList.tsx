"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye, Printer, Download } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Expense, Category, ExpenseType } from "@/types/Props";
import jsPDF from "jspdf";
import "jspdf-autotable";

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

const ITEMS_PER_PAGE = 10;

export default function ExpenseList({
  expenses,
  onEdit,
  onDelete,
  onSort,
  sortConfig,
  categories,
  expenseTypes,
}: {
  expenses: Expense[] | null | undefined;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  onSort: (key: SortableExpenseKey) => void;
  sortConfig: SortConfig;
  categories: Category[] | null | undefined;
  expenseTypes: ExpenseType[] | null | undefined;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

  const getCategoryName = (id: number): string => {
    if (!Array.isArray(categories)) {
      console.warn("Categories is not an array:", categories);
      return "Unknown";
    }
    return categories.find((cat) => cat.id === id)?.name || "Unknown";
  };

  const getTypeName = (id: number): string => {
    if (!Array.isArray(expenseTypes)) {
      console.warn("ExpenseTypes is not an array:", expenseTypes);
      return "Unknown";
    }
    return expenseTypes.find((type) => type.id === id)?.name || "Unknown";
  };

  const handleDelete = (expense: Expense) => {
    if (typeof expense.id === "number") {
      onDelete(expense.id);
    } else {
      console.error("Cannot delete expense without a valid id");
    }
  };

  const sortedExpenses = useMemo(() => {
    if (!Array.isArray(expenses) || expenses.length === 0) {
      console.log("No expenses to sort");
      return [];
    }
    console.log("Sorting expenses:", expenses.length);
    const result = [...expenses];
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
    return result;
  }, [expenses, sortConfig]);

  const pageCount = Math.ceil((sortedExpenses?.length || 0) / ITEMS_PER_PAGE);

  const currentExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedExpenses, currentPage]);

  const getSortIcon = (key: SortableExpenseKey) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? "↑" : "↓";
    }
    return null;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!viewingExpense) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Expense Voucher", 14, 22);

    doc.setFontSize(12);
    doc.text(`Description: ${viewingExpense.description}`, 14, 30);
    doc.text(`Amount: $${viewingExpense.amount.toFixed(2)}`, 14, 38);
    doc.text(
      `Date: ${new Date(viewingExpense.date).toLocaleDateString()}`,
      14,
      46
    );
    doc.text(`Category: ${getCategoryName(viewingExpense.categoryId)}`, 14, 54);
    doc.text(`Type: ${getTypeName(viewingExpense.typeId)}`, 14, 62);
    doc.text(`Payment Method: ${viewingExpense.PaymentMethod}`, 14, 70);
    doc.text(`Vendor/Payee: ${viewingExpense.vendorPayee}`, 14, 78);
    doc.text(`Location: ${viewingExpense.expenseLocation}`, 14, 86);

    doc.save(`expense_voucher_${viewingExpense.id}.pdf`);
  };

  if (!Array.isArray(expenses) || expenses.length === 0) {
    return <div>No expenses data available.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => onSort("description")}
                className="hidden md:table-cell cursor-pointer"
              >
                Description {getSortIcon("description")}
              </TableHead>
              <TableHead
                onClick={() => onSort("amount")}
                className="cursor-pointer"
              >
                Amount MZN{getSortIcon("amount")}
              </TableHead>
              <TableHead
                onClick={() => onSort("date")}
                className="hidden sm:table-cell cursor-pointer"
              >
                Date {getSortIcon("date")}
              </TableHead>
              <TableHead
                onClick={() => onSort("categoryId")}
                className="hidden lg:table-cell cursor-pointer"
              >
                Category {getSortIcon("categoryId")}
              </TableHead>
              <TableHead
                onClick={() => onSort("typeId")}
                className="hidden lg:table-cell cursor-pointer"
              >
                Type {getSortIcon("typeId")}
              </TableHead>
              <TableHead
                onClick={() => onSort("PaymentMethod")}
                className="hidden xl:table-cell cursor-pointer"
              >
                Payment Method {getSortIcon("PaymentMethod")}
              </TableHead>
              <TableHead
                onClick={() => onSort("vendorPayee")}
                className="hidden xl:table-cell cursor-pointer"
              >
                Vendor/Payee {getSortIcon("vendorPayee")}
              </TableHead>
              <TableHead
                onClick={() => onSort("expenseLocation")}
                className="hidden xl:table-cell cursor-pointer"
              >
                Location {getSortIcon("expenseLocation")}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentExpenses.length > 0 ? (
              currentExpenses.map((expense) => (
                <TableRow key={expense.id ?? `temp-${expense.description}`}>
                  <TableCell className="font-medium hidden md:table-cell">
                    {expense.description}
                  </TableCell>
                  <TableCell>{expense.amount}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(expense.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {getCategoryName(expense.categoryId)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {getTypeName(expense.typeId)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {expense.PaymentMethod}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {expense.vendorPayee}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {expense.expenseLocation}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingExpense(expense)}
                      className="mr-2"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(expense)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(expense)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, index) => (
              <PaginationItem key={index} className="hidden sm:inline-block">
                <PaginationLink
                  onClick={() => setCurrentPage(index + 1)}
                  isActive={currentPage === index + 1}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, pageCount))
                }
                className={
                  currentPage === pageCount
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog
        open={!!viewingExpense}
        onOpenChange={(open) => !open && setViewingExpense(null)}
      >
        <DialogContent className="bg-white text-black">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4">
              <p>
                <strong>Description:</strong> {viewingExpense.description}
              </p>
              <p>
                <strong>Amount:</strong> ${viewingExpense.amount.toFixed(2)}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(viewingExpense.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Category:</strong>{" "}
                {getCategoryName(viewingExpense.categoryId)}
              </p>
              <p>
                <strong>Type:</strong> {getTypeName(viewingExpense.typeId)}
              </p>
              <p>
                <strong>Payment Method:</strong> {viewingExpense.PaymentMethod}
              </p>
              <p>
                <strong>Vendor/Payee:</strong> {viewingExpense.vendorPayee}
              </p>
              <p>
                <strong>Location:</strong> {viewingExpense.expenseLocation}
              </p>
              {viewingExpense.receiptUpload && (
                <p>
                  <strong>Receipt:</strong>{" "}
                  <a
                    href={viewingExpense.receiptUpload}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Receipt
                  </a>
                </p>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-center sm:justify-end gap-2">
            <Button onClick={handlePrint} className="mr-2">
              <Printer className="h-4 w-4 mr-2" /> Print Voucher
            </Button>
            <Button onClick={handleDownload} className="mr-2">
              <Download className="h-4 w-4 mr-2" /> Download Voucher
            </Button>
            <Button
              onClick={() => {
                if (viewingExpense && typeof viewingExpense.id === "number") {
                  onDelete(viewingExpense.id);
                  setViewingExpense(null);
                }
              }}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
