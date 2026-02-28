import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { wageApi } from "@/api/wage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DateRangeFilter from "@/components/DateRangeFilter";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { Plus, Users, Trash2 } from "lucide-react";

const WagePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: wages = [], isLoading } = useQuery({
    queryKey: ["wage", startDate, endDate],
    queryFn: () => wageApi.getAll({ startDate, endDate }),
  });

  const total = wages.reduce((s, w) => s + w.amount, 0);

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
        <DateRangeFilter startDate={startDate} endDate={endDate} onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }} />

        <Card className="border-wage/20">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Total ({wages.length} entries)</p>
            <p className="text-xl font-bold text-wage">₹{total.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={() => navigate("/wages/add")} disabled={isApiLoading}>
          <Plus className="mr-2 h-4 w-4" /> {isApiLoading ? "Please wait..." : "Add Wage"}
        </Button>

        <Card>
          <CardContent className="divide-y divide-border py-0">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading wages...</p>
            ) : wages.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No wage entries</p>
            ) : (
              wages.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wage/10">
                      <Users className="h-4 w-4 text-wage" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.employeeName || "Unknown Employee"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("en-IN", { 
                          timeZone: "Asia/Kolkata" 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-wage">₹{item.amount.toLocaleString("en-IN")}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending || isApiLoading}
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
