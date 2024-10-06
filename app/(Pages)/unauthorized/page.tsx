import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-green-500 border-2">
        <CardHeader className="bg-green-500 text-white">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle size={48} />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Unauthorized Access
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          <CardDescription className="text-center text-gray-700 text-lg">
            Sorry, you don&apos;t have permission to access this page. Please
            contact your administrator if you believe this is an error.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
