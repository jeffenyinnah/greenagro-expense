"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterConfig, Category, ExpenseType } from "@/types/Props";

interface ExpenseFilterProps {
  onFilterChange: (filters: FilterConfig) => void;
  categories: Category[] | null | undefined;
  expenseTypes: ExpenseType[] | null | undefined;
}

export default function ExpenseFilter({
  onFilterChange,
  categories,
  expenseTypes,
}: ExpenseFilterProps) {
  const [filters, setFilters] = useState<FilterConfig>({
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    categoryId: "",
    typeId: "",
    paymentMethod: "",
  });

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
      categoryId: "",
      typeId: "",
      paymentMethod: "",
    });
  };

  return (
    <div className="space-y-4 bg-white text-black p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date and Amount inputs remain unchanged */}
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="minAmount">Min Amount</Label>
          <Input
            type="number"
            id="minAmount"
            name="minAmount"
            value={filters.minAmount}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="maxAmount">Max Amount</Label>
          <Input
            type="number"
            id="maxAmount"
            name="maxAmount"
            value={filters.maxAmount}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select
            name="categoryId"
            value={filters.categoryId}
            onValueChange={(value) => handleSelectChange("categoryId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
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
            value={filters.typeId}
            onValueChange={(value) => handleSelectChange("typeId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an expense type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Array.isArray(expenseTypes) && expenseTypes.length > 0 ? (
                expenseTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No expense types available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select
            name="paymentMethod"
            value={filters.paymentMethod}
            onValueChange={(value) =>
              handleSelectChange("paymentMethod", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleClearFilters} variant="outline" className="w-full">
        Clear Filters
      </Button>
    </div>
  );
}
