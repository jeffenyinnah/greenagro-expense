export type Category = {
    id: number;
    name: string;
  };

export type ExpenseType = {
  id: number;
  name: string;
};

export type Expense = {
  id?: number;
  description: string;
  amount: number;
  date: string;
  categoryId: number;
  typeId: number;
  PaymentMethod: string;
  vendorPayee: string;
  receiptUpload: string;
  expenseLocation: string;
};

export type FilterConfig = {
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  categoryId: string;
  typeId: string;
  paymentMethod: string;
};

export type ExpenseFilterProps = {
  onFilterChange: (filters: FilterConfig) => void;
  categories: Category[];
  expenseTypes: ExpenseType[];
};

 // Define a User type
export type User = {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
};

export type PaymentMethod = {
  CASH: string;
  TRANSFER: string;
}
