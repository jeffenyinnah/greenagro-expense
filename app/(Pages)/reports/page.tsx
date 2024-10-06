"use client";

import { useState } from "react";
import ExpenseReport from "@/components/Expense/ExpenseReport";
import GeneratedReports from "@/components/Expense/GeneratedReports";
import { FileText } from "lucide-react";

export default function ReportPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshReports = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center mb-2">
          <FileText className="w-10 h-10 mr-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Expense Reports
          </h1>
        </div>
        <p className="text-xl opacity-80">
          Generate, view, and manage your expense reports
        </p>
      </div>
      <div className="mb-8">
        <ExpenseReport onReportGenerated={refreshReports} />
      </div>
      <div>
        <GeneratedReports refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
