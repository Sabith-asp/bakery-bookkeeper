import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { wageApi } from "@/api/wage";
import { employeeApi } from "@/api/employee";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { ArrowLeft } from "lucide-react";

const AddWagePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const [employeeId, setEmployeeId] = useState("");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["employee"],
    queryFn: employeeApi.getAll,
  });

  const mutation = useMutation({
    mutationFn: wageApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage"] });
      toast({ title: "Success", description: "Wage added successfully" });
      navigate("/wages");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add wage", variant: "destructive" });
    },
  });

  const addEmployeeMutation = useMutation({
    mutationFn: employeeApi.create,
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ["employee"] });
      setEmployeeId(employee.id);
      setNewEmployeeName("");
      toast({ title: "Success", description: "Employee added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add employee", variant: "destructive" });
    },
  });

  const handleAddEmployee = () => {
    if (!newEmployeeName.trim()) {
      toast({ title: "Error", description: "Enter employee name", variant: "destructive" });
      return;
    }

    addEmployeeMutation.mutate(newEmployeeName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (!employeeId) {
      toast({ title: "Error", description: "Select an employee", variant: "destructive" });
      return;
    }
    mutation.mutate({ employeeId, amount: parsedAmount, date, description: description.trim() || undefined });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold font-display">Add Wage</h1>
      </div>

      <div className="px-4 pt-4">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Employee</label>
                <Select value={employeeId} onValueChange={setEmployeeId} disabled={isEmployeesLoading || isApiLoading}>
                  <SelectTrigger>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Add New Employee</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Rahul"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    maxLength={100}
                    disabled={addEmployeeMutation.isPending || isApiLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddEmployee}
                    disabled={addEmployeeMutation.isPending || isApiLoading}
                  >
                    {addEmployeeMutation.isPending ? "Adding..." : "Add"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input placeholder="e.g. Salary" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Amount (₹)</label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending || isApiLoading}>
                {mutation.isPending ? "Saving..." : isApiLoading ? "Please wait..." : "Save Wage"}
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
