"use client";

import React, { useState, useEffect } from "react";
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
import { Expense, Category, ExpenseType } from "@/types/Props";

type PaymentMethod = "CASH" | "TRANSFER";

export type ExpenseFormData = Omit<Expense, "id"> & { id?: number };

interface ExpenseFormProps {
  onSubmit: (
    expense: ExpenseFormData,
    file: File | null
  ) => void | Promise<void>;
  expense?: Expense;
  categories: Category[] | null | undefined;
  expenseTypes: ExpenseType[] | null | undefined;
}

export default function ExpenseForm({
  onSubmit,
  expense,
  categories,
  expenseTypes,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    categoryId: 0,
    typeId: 0,
    PaymentMethod: "CASH" as PaymentMethod,
    vendorPayee: "",
    receiptUpload: "",
    expenseLocation: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (expense) {
      setFormData({
        ...expense,
        date: new Date(expense.date).toISOString().split("T")[0],
        categoryId: expense.categoryId,
        typeId: expense.typeId,
      });
    }
  }, [expense]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const submissionData: ExpenseFormData = {
      ...formData,
      amount: parseFloat(formData.amount.toString()),
      categoryId: parseInt(formData.categoryId.toString()),
      typeId: parseInt(formData.typeId.toString()),
      PaymentMethod: formData.PaymentMethod as PaymentMethod,
      date: new Date(formData.date).toISOString().split("T")[0],
    };

    try {
      await onSubmit(submissionData, file);
    } catch (err) {
      setError("Error submitting expense. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white text-black">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select
            name="categoryId"
            value={formData.categoryId.toString()}
            onValueChange={(value) => handleSelectChange("categoryId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  No categories available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="typeId">Expense Type</Label>
          <Select
            name="typeId"
            value={formData.typeId.toString()}
            onValueChange={(value) => handleSelectChange("typeId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an expense type" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(expenseTypes) && expenseTypes.length > 0 ? (
                expenseTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  No expense types available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="PaymentMethod">Payment Method</Label>
          <Select
            name="PaymentMethod"
            value={formData.PaymentMethod}
            onValueChange={(value) =>
              handleSelectChange("PaymentMethod", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="vendorPayee">Vendor/Payee</Label>
          <Input
            id="vendorPayee"
            name="vendorPayee"
            value={formData.vendorPayee}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="expenseLocation">Expense Location</Label>
          <Input
            id="expenseLocation"
            name="expenseLocation"
            value={formData.expenseLocation}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="receiptUpload">Receipt Upload</Label>
          <Input
            id="receiptUpload"
            name="receiptUpload"
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700"
        disabled={isLoading}
      >
        {isLoading
          ? "Submitting..."
          : expense
          ? "Update Expense"
          : "Add Expense"}
      </Button>
    </form>
  );
}
