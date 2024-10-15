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
      console.error(
        "Não é possível eliminar despesas sem uma identificação válida"
      );
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
    if (viewingExpense) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        const content = `
          <html>
            <head>
              <title>Print Voucher</title>
              <style>
                body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.2; }
                .voucher { max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; }
                .logo { width: 80px; height: auto; }
                .title { text-align: center; flex-grow: 1; }
                .form-number { text-align: right; }
                h1, h2, h3 { margin: 5px 0; }
                .voucher-title { text-align: center; margin: 10px 0; }
                .details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; }
                .expense-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                .expense-table th, .expense-table td { border: 1px solid #000; padding: 5px; text-align: left; }
                .totals { margin: 10px 0; }
                .certificate { margin: 10px 0; font-size: 10px; }
                .signature { margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="voucher">
                <div class="header">
                  <img src="/logo.png" alt="Logo" class="logo" />
                  <div class="title">
                    <h1>NOME DA ORGANIZAÇÃO</h1>
                    <h3>MAPUTO-MOÇAMBIQUE</h3>
                  </div>
                  <div class="form-number">
                    <p>Tesouraria F1</p>
                    <p>N° ${viewingExpense.id?.toString().padStart(4, "0")}</p>
                  </div>
                </div>
                <h2 class="voucher-title">VALE DE PAGAMENTO</h2>
                <p>Verificado e aprovado para pagamento no MAPUTO</p>
                <div class="details">
                  <p><strong>Código de classificação:</strong> 26</p>
                  <p><strong>Data:</strong> ${
                    new Date(viewingExpense.date).toISOString().split("T")[0]
                  }</p>
                  <p><strong>Momtante:</strong> MZN${viewingExpense.amount.toFixed(
                    2
                  )}</p>
                  <p><strong>Método de pagamento:</strong> ${
                    viewingExpense.PaymentMethod
                  }</p>
                  <p><strong>Categoria:</strong> ${getCategoryName(
                    viewingExpense.categoryId
                  )}</p>
                  <p><strong>Tipo:</strong> ${getTypeName(
                    viewingExpense.typeId
                  )}</p>
                  <p><strong>Beneficiário (Payee):</strong> ${
                    viewingExpense.vendorPayee
                  }</p>
                  <p><strong>Endereço:</strong> ${
                    viewingExpense.expenseLocation
                  }</p>
                </div>
                <table class="expense-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição detalhada do serviço/trabalho</th>
                      <th>MZN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${
                        new Date(viewingExpense.date)
                          .toISOString()
                          .split("T")[0]
                      }</td>
                      <td>${viewingExpense.description}</td>
                      <td>${viewingExpense.amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="totals">
                  <p><strong>IVA (16%):</strong> 0.16</p>
                  <p><strong>Total:</strong> ${viewingExpense.amount.toFixed(
                    2
                  )}</p>
                  <p><strong>Total com IVA(16%):</strong> ${(
                    viewingExpense.amount * 1.16
                  ).toFixed(2)} MZN</p>
                </div>
                <div class="certificate">
                  <h3>CERTIFICADO</h3>
                  <p>---Certifico que o montante acima indicado é correto e foi incorrido ao abrigo da Autoridade indicada, que o serviço foi
                  devidamente executado, que a taxa/preço cobrado está de acordo com os regulamentos/contrato é justo e razoável
                  que o montante de ......................................................... Meticais
                  pode ser pago no âmbito da classificação citada</p>
                </div>
                <div class="signature">
                  <p>Assinatura da Organização</p>
                  <p>Diretor</p>
                </div>
              </div>
            </body>
          </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();

        printWindow.onload = function () {
          printWindow.print();
          printWindow.onafterprint = function () {
            printWindow.close();
          };
        };
      } else {
        console.error("Failed to open print window");
      }
    }
  };

  const handleDownload = () => {
    if (!viewingExpense || typeof viewingExpense.id === "undefined") {
      console.error(
        "Cannot download voucher: expense or expense ID is undefined"
      );
      return;
    }

    const doc = new jsPDF();

    // Add logo
    // Note: You'll need to replace '/path/to/your/logo.png' with the actual path to your logo
    doc.addImage("/logo.png", "PNG", 15, 15, 30, 30);

    // Set up the document header
    doc.setFontSize(16);
    doc.setTextColor(23, 163, 74); // Blue color for header text
    doc.text("NOME DA ORGANIZAÇÃO", 105, 25, { align: "center" });
    doc.setFontSize(14);
    doc.text("MAPUTO-MOÇAMBIQUE", 105, 45, { align: "center" });

    // Add form details (Treasury F1 and Number)
    doc.setFontSize(12);
    doc.setTextColor(0); // Reset to black
    doc.rect(150, 15, 45, 20); // Add a border around the form number
    doc.text("Tesouraria F1", 153, 25);
    doc.text(`N° ${viewingExpense.id.toString().padStart(4, "0")}`, 153, 32);

    // Payment Voucher title
    doc.setFontSize(18);
    doc.setTextColor(0); // Black color
    doc.text("VALE DE PAGAMENTO", 105, 60, { align: "center" });

    // Checked and passed for payment
    doc.setFontSize(10);
    doc.text("Verificado e aprovado para pagamento no MAPUTO", 15, 70);

    // Add table for classification code
    doc.rect(15, 75, 180, 10);
    doc.text("Código de classificação", 17, 81);
    doc.text("26", 100, 81);

    // Add date, amount, and other details
    doc.rect(15, 87, 180, 40);
    doc.text(
      `Data: ${new Date(viewingExpense.date).toISOString().split("T")[0]}`,
      17,
      93
    );
    doc.text(`Montante: MZN${viewingExpense.amount.toFixed(2)}`, 100, 93);
    doc.text(`Método de pagamento: ${viewingExpense.PaymentMethod}`, 17, 101);
    doc.text(
      `Categoria: ${getCategoryName(viewingExpense.categoryId)}`,
      17,
      109
    );
    doc.text(`Tipo: ${getTypeName(viewingExpense.typeId)}`, 100, 109);
    doc.text(`Beneficiário (Payee): ${viewingExpense.vendorPayee}`, 17, 117);
    doc.text(`Endereço: ${viewingExpense.expenseLocation}`, 17, 125);

    // Add expense details
    doc.rect(15, 129, 180, 40);
    doc.setFillColor(240, 240, 240); // Light gray background for header
    doc.rect(15, 129, 180, 8, "F");
    doc.text("Data", 17, 135);
    doc.text("Descrição detalhada do serviço/trabalho", 50, 135);
    doc.text("MZN", 170, 135);
    doc.text(
      new Date(viewingExpense.date).toISOString().split("T")[0],
      17,
      143
    );
    doc.text(viewingExpense.description, 50, 143, { maxWidth: 110 });
    doc.text(viewingExpense.amount.toFixed(2), 170, 143);

    // Add total and exchange rate
    doc.rect(15, 171, 180, 20);
    doc.text(`IVA (16%): 0.16`, 17, 177);
    doc.text(`Total`, 150, 177);
    doc.text(viewingExpense.amount.toFixed(2), 170, 177);
    doc.text(`Total com IVA`, 130, 185);
    doc.text((viewingExpense.amount * 1.16).toFixed(2), 170, 185);

    // Add certificate
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 193, 180, 8, "F");
    doc.text("CERTIFICADO", 105, 199, { align: "center" });
    doc.setFontSize(8);
    doc.text(
      "---Certifico que o montante acima indicado é correto e foi incorrido ao abrigo da Autoridade indicada, que o serviço foi",
      17,
      207
    );
    doc.text(
      "devidamente efectuada, que a taxa/preço cobrado é, de acordo com os regulamentos/contrato, justa e razoável",
      17,
      213
    );
    doc.text(
      "que o montante de ......................................................... Meticais",
      17,
      219
    );
    doc.text("pode ser pago no âmbito da classificação citada", 17, 225);

    doc.line(140, 240, 190, 240); // Signature line
    doc.text("Assinatura da Organização", 140, 246);
    doc.text("Diretor", 140, 252);

    // Add current date at the bottom
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Gerado em: ${currentDate}`, 105, 280, { align: "center" });

    doc.save(`expense_voucher_${viewingExpense.id}.pdf`);
  };

  if (!Array.isArray(expenses) || expenses.length === 0) {
    return <div>Não há dados disponíveis sobre as despesas.</div>;
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
                Descrição {getSortIcon("description")}
              </TableHead>
              <TableHead
                onClick={() => onSort("amount")}
                className="cursor-pointer"
              >
                Montante MZN{getSortIcon("amount")}
              </TableHead>
              <TableHead
                onClick={() => onSort("date")}
                className="hidden sm:table-cell cursor-pointer"
              >
                Data {getSortIcon("date")}
              </TableHead>
              <TableHead
                onClick={() => onSort("categoryId")}
                className="hidden lg:table-cell cursor-pointer"
              >
                Categoria {getSortIcon("categoryId")}
              </TableHead>
              <TableHead
                onClick={() => onSort("typeId")}
                className="hidden lg:table-cell cursor-pointer"
              >
                Tipo {getSortIcon("typeId")}
              </TableHead>
              <TableHead
                onClick={() => onSort("PaymentMethod")}
                className="hidden xl:table-cell cursor-pointer"
              >
                Método de pagamento {getSortIcon("PaymentMethod")}
              </TableHead>
              <TableHead
                onClick={() => onSort("vendorPayee")}
                className="hidden xl:table-cell cursor-pointer"
              >
                Fornecedor/Destinatário {getSortIcon("vendorPayee")}
              </TableHead>
              <TableHead
                onClick={() => onSort("expenseLocation")}
                className="hidden xl:table-cell cursor-pointer"
              >
                Localização {getSortIcon("expenseLocation")}
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
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
                  Não foram detectadas despesas.
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
            <DialogTitle>Detalhes da Despesa</DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4">
              <p>
                <strong>Descrição:</strong> {viewingExpense.description}
              </p>
              <p>
                <strong>Montante:</strong> MZN{viewingExpense.amount.toFixed(2)}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {new Date(viewingExpense.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Categoria:</strong>{" "}
                {getCategoryName(viewingExpense.categoryId)}
              </p>
              <p>
                <strong>Tipo:</strong> {getTypeName(viewingExpense.typeId)}
              </p>
              <p>
                <strong>Método de pagamento:</strong>{" "}
                {viewingExpense.PaymentMethod}
              </p>
              <p>
                <strong>Fornecedor/Destinatário:</strong>{" "}
                {viewingExpense.vendorPayee}
              </p>
              <p>
                <strong>Localização:</strong> {viewingExpense.expenseLocation}
              </p>
              {viewingExpense.receiptUpload && (
                <p>
                  <strong>Recibo:</strong>{" "}
                  <a
                    href={viewingExpense.receiptUpload}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver recibo
                  </a>
                </p>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-center sm:justify-end gap-2">
            <Button onClick={handlePrint} className="mr-2">
              <Printer className="h-4 w-4 mr-2" /> Imprimir vale
            </Button>
            <Button onClick={handleDownload} className="mr-2">
              <Download className="h-4 w-4 mr-2" /> Descarregar o vale
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
              <Trash2 className="h-4 w-4 mr-2" /> Apagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
