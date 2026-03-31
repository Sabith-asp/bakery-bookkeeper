import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { wageApi } from "@/api/wage";
import { employeeApi } from "@/api/employee";
import type { Wage } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import { cn } from "@/lib/utils";
import { ArrowLeft, Users } from "lucide-react";

const MAX_DESC = 100;

const AddWagePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const editItem = location.state?.item as Wage | undefined;
  const isEditMode = !!editItem;
  const prefillEmployeeId = location.state?.prefillEmployeeId as string | undefined;
  const returnTo = location.state?.returnTo as string | undefined;

  const [employeeId, setEmployeeId] = useState(editItem?.employeeId ?? prefillEmployeeId ?? "");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [paymentMethod, setPaymentMethod] = useState(editItem?.paymentMethod ?? "");
  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : "");
  const [date, setDate] = useState(editItem ? editItem.date.substring(0, 10) : format(new Date(), "yyyy-MM-dd"));

  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["employee"],
    queryFn: employeeApi.getAll,
  });

  const selectedEmployee = employees.find((e) => e.id === employeeId);

  const mutation = useMutation({
    mutationFn: (data: { employeeId: string; amount: number; date: string; description?: string }) =>
      isEditMode ? wageApi.update(editItem!.id, data) : wageApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast({ title: "Success", description: isEditMode ? "Wage updated" : "Wage saved" });
      navigate(returnTo ?? "/wages");
    },
    onError: () => {
      toast({ title: "Error", description: isEditMode ? "Failed to update wage" : "Failed to save wage", variant: "destructive" });
    },
  });

  const addEmployeeMutation = useMutation({
    mutationFn: employeeApi.create,
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ["employee"] });
      setEmployeeId(employee.id);
      setNewEmployeeName("");
      toast({ title: "Employee added", description: `${employee.name} added successfully` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add employee", variant: "destructive" });
    },
  });

  const handleAddEmployee = () => {
    if (!newEmployeeName.trim()) {
      toast({ title: "Name required", description: "Enter employee name", variant: "destructive" });
      return;
    }
    addEmployeeMutation.mutate(newEmployeeName.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: "Invalid amount", description: "Enter an amount greater than 0", variant: "destructive" });
      return;
    }
    if (!employeeId) {
      toast({ title: "Employee required", description: "Select an employee", variant: "destructive" });
      return;
    }
    mutation.mutate({ employeeId, amount: parsedAmount, date, description: description.trim() || undefined, paymentMethod: paymentMethod || undefined });
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display leading-tight">{isEditMode ? "Edit Wage" : "Add Wage"}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{isEditMode ? "Update wage entry" : "Record an employee wage"}</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Accent card — shows selected employee or generic */}
        <div className="flex items-center gap-3 rounded-xl bg-wage/10 border border-wage/20 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wage/15">
            {selectedEmployee ? (
              <span className="text-base font-bold text-wage">{selectedEmployee.name.charAt(0).toUpperCase()}</span>
            ) : (
              <Users className="h-5 w-5 text-wage" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-wage">
              {selectedEmployee ? selectedEmployee.name : isEditMode ? "Editing Wage Entry" : "New Wage"}
            </p>
            <p className="text-xs text-wage/70">
              {selectedEmployee ? "Selected employee" : "Salary, bonus, daily wage payments"}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Employee Select */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Employee</label>
                <Select value={employeeId} onValueChange={setEmployeeId} disabled={isEmployeesLoading || isApiLoading}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={isEmployeesLoading ? "Loading employees..." : "Select employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add New Employee (add mode only) */}
              {!isEditMode && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Add New Employee</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Rahul"
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                      maxLength={100}
                      disabled={addEmployeeMutation.isPending || isApiLoading}
                      className="h-11"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddEmployee(); } }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 shrink-0 px-5"
                      onClick={handleAddEmployee}
                      disabled={addEmployeeMutation.isPending || isApiLoading}
                    >
                      {addEmployeeMutation.isPending ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-base select-none">₹</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="pl-7 h-12 text-base font-semibold"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <span className="text-xs text-muted-foreground">{description.length}/{MAX_DESC}</span>
                </div>
                <Input
                  placeholder="e.g. Monthly salary, Bonus"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_DESC}
                  className="h-11"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Payment Method <span className="font-normal text-muted-foreground">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod((p) => (p === m ? "" : m))}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg border font-medium transition-all",
                        paymentMethod === m
                          ? "bg-wage text-wage-foreground border-wage shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:border-wage/40 hover:text-foreground"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Date</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDate(today)}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${date === today ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40"}`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(yesterday)}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${date === yesterday ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40"}`}
                  >
                    Yesterday
                  </button>
                </div>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-wage hover:bg-wage/90 text-wage-foreground mt-1"
                disabled={mutation.isPending || isApiLoading}
              >
                {mutation.isPending ? "Saving..." : isApiLoading ? "Please wait..." : isEditMode ? "Update Wage" : "Save Wage"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddWagePage;
