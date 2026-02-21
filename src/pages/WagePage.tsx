import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { wageApi } from "@/api/wage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Trash2 } from "lucide-react";

const WagePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: wages = [] } = useQuery({
    queryKey: ["wage", filterDate],
    queryFn: () => wageApi.getAll({ startDate: filterDate, endDate: filterDate }),
  });

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: monthlyWages = [] } = useQuery({
    queryKey: ["wage", "monthly", monthStart, monthEnd],
    queryFn: () => wageApi.getAll({ startDate: monthStart, endDate: monthEnd }),
  });

  const monthlyTotal = monthlyWages.reduce((s, w) => s + w.amount, 0);
  const dailyTotal = wages.reduce((s, w) => s + w.amount, 0);

  const deleteMutation = useMutation({
    mutationFn: wageApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage"] });
      toast({ title: "Deleted", description: "Wage entry removed" });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Wages" subtitle="Track employee payments" />

      <div className="space-y-4 px-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-wage/20">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-lg font-bold text-wage">₹{dailyTotal.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card className="border-wage/20">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-lg font-bold text-wage">₹{monthlyTotal.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
        </div>

        <Button className="w-full" onClick={() => navigate("/wages/add")}>
          <Plus className="mr-2 h-4 w-4" /> Add Wage
        </Button>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Filter by Date</label>
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        </div>

        <Card>
          <CardContent className="divide-y divide-border py-0">
            {wages.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No wage entries</p>
            ) : (
              wages.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wage/10">
                      <Users className="h-4 w-4 text-wage" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-wage">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default WagePage;
