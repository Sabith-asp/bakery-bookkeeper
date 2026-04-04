import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { wageApi } from "@/api/wage";
import { employeeApi } from "@/api/employee";
import { divisionApi } from "@/api/division";
import type { Wage } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import DatePickerDrawer from "@/components/DatePickerDrawer";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import { cn } from "@/lib/utils";
import { ArrowLeft, Users, Check } from "lucide-react";
import SaveSuccessOverlay from "@/components/SaveSuccessOverlay";

const MAX_DESC = 100;

const AddWagePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();
  const { hasModule } = useAuth();

  const editItem = location.state?.item as Wage | undefined;
  const isEditMode = !!editItem;
  const prefillEmployeeId = location.state?.prefillEmployeeId as string | undefined;
  const returnTo = location.state?.returnTo as string | undefined;

  const [employeeId, setEmployeeId] = useState(editItem?.employeeId ?? prefillEmployeeId ?? "");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [paymentMethod, setPaymentMethod] = useState(editItem?.paymentMethod ?? "");
  const [divisionId, setDivisionId] = useState(editItem?.divisionId ?? "");
  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : "");
  const [date, setDate] = useState(editItem ? editItem.date.substring(0, 10) : format(new Date(), "yyyy-MM-dd"));
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["employee"],
    queryFn: employeeApi.getAll,
  });

  const { data: divisions = [] } = useQuery({
    queryKey: ["division"],
    queryFn: divisionApi.getAll,
    enabled: hasModule("Divisions"),
  });

  const mutation = useMutation({
    mutationFn: (data: { employeeId: string; amount: number; date: string; description?: string; paymentMethod?: string; divisionId?: string }) =>
      isEditMode ? wageApi.update(editItem!.id, data) : wageApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setShowSuccess(true);
      setTimeout(() => navigate(returnTo ?? "/wages"), 900);
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
    mutation.mutate({ employeeId, amount: parsedAmount, date, description: description.trim() || undefined, paymentMethod: paymentMethod || undefined, divisionId: divisionId || undefined });
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <SaveSuccessOverlay show={showSuccess} />
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-wage/15">
            <Users className="h-3.5 w-3.5 text-wage" />
          </div>
          <h1 className="text-lg font-bold leading-tight">{isEditMode ? "Edit Wage" : "Add Wage"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-4 pt-5 space-y-6">

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

          <div className="h-px bg-border/60" />

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg select-none">₹</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 h-14 text-2xl font-bold tracking-tight"
              />
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Description <span className="font-normal text-muted-foreground text-xs">(optional)</span>
              </label>
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

          <div className="h-px bg-border/60" />

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Date</label>
            <DatePickerDrawer value={date} onChange={setDate} />
          </div>

          <div className="h-px bg-border/60" />

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Payment Method <span className="font-normal text-muted-foreground text-xs">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod((p) => (p === m ? "" : m))}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-xs rounded-lg border font-medium transition-all",
                    paymentMethod === m
                      ? "bg-wage text-wage-foreground border-wage shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-wage/40 hover:text-foreground"
                  )}
                >
                  {paymentMethod === m && <Check className="h-3 w-3 shrink-0" />}
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Division */}
          {divisions.length > 0 && (
            <>
              <div className="h-px bg-border/60" />
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Division <span className="font-normal text-muted-foreground text-xs">(optional)</span>
                </label>
                <Select value={divisionId || "none"} onValueChange={(v) => setDivisionId(v === "none" ? "" : v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="No division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {divisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

        </div>
      </form>

      {/* Sticky submit */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border/60 z-30">
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-wage hover:bg-wage/90 text-wage-foreground"
          disabled={mutation.isPending || isApiLoading}
          onClick={handleSubmit}
        >
          {mutation.isPending ? "Saving..." : isApiLoading ? "Please wait..." : isEditMode ? "Update Wage" : "Save Wage"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddWagePage;
