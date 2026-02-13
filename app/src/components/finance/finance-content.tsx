"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseTable } from "./expense-table";
import { OwnerStatementCard } from "./owner-statement-card";
import { DollarSign, FileText } from "lucide-react";
import type { Expense, OwnerStatement } from "@/types/operations";
import type { Listing } from "@/types/hostaway";

interface FinanceContentProps {
  expenses: Expense[];
  statements: OwnerStatement[];
  properties: Listing[];
}

export function FinanceContent({ expenses, statements, properties }: FinanceContentProps) {
  return (
    <Tabs defaultValue="expenses">
      <TabsList>
        <TabsTrigger value="expenses" className="gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          Expenses
        </TabsTrigger>
        <TabsTrigger value="statements" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Statements
        </TabsTrigger>
      </TabsList>
      <TabsContent value="expenses">
        <ExpenseTable initialExpenses={expenses} properties={properties} />
      </TabsContent>
      <TabsContent value="statements">
        <OwnerStatementCard statements={statements} properties={properties} />
      </TabsContent>
    </Tabs>
  );
}
