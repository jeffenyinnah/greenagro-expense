"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Report = {
  id: number;
  name: string;
  description: string;
  fileUrl: string;
  createdAt: string;
};

interface GeneratedReportsProps {
  refreshTrigger: number;
}

export default function GeneratedReports({
  refreshTrigger,
}: GeneratedReportsProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]); // Add refreshTrigger to the dependency array

  const fetchReports = async () => {
    const response = await fetch("/api/reports");
    if (response.ok) {
      const data = await response.json();
      setReports(data);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, fileName, "_blank");
  };

  const handleDelete = async (id: number) => {
    const response = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    if (response.ok) {
      fetchReports();
      toast({
        title: "Report Deleted",
        description: "Your report was successfully deleted.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Relatórios gerados</CardTitle>
      </CardHeader>
      <CardContent>
        {reports.map((report) => (
          <div key={report.id} className="mb-4 p-4 border rounded">
            <h3 className="text-lg font-semibold">{report.name}</h3>
            <p className="text-sm text-gray-500">{report.description}</p>
            <p className="text-sm text-gray-500">
              Criado: {new Date(report.createdAt).toLocaleString()}
            </p>
            <div className="mt-2">
              <Button
                onClick={() =>
                  handleDownload(report.fileUrl, `${report.name}.xlsx`)
                }
                className="mr-2"
              >
                Descarregar
              </Button>
              <Button
                onClick={() => handleDelete(report.id)}
                variant="destructive"
              >
                Apagar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
