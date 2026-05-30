import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/api/inventory";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { ArrowLeft, Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import SaveSuccessOverlay from "@/components/SaveSuccessOverlay";

const PRESET_UNITS = ["pcs", "kg", "g", "litre", "ml", "box"] as const;

const AddProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const editItem = location.state?.item as Product | undefined;
  const isEditMode = !!editItem;

  const [name, setName]               = useState(editItem?.name ?? "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [sku, setSku]                 = useState(editItem?.sku ?? "");
  const [categoryId, setCategoryId]   = useState(editItem?.categoryId ?? "");
  const [unit, setUnit]               = useState(editItem?.unit ?? "pcs");
  const [customUnit, setCustomUnit]   = useState(!PRESET_UNITS.includes(editItem?.unit as any) ? (editItem?.unit ?? "") : "");
  const [useCustomUnit, setUseCustomUnit] = useState(!PRESET_UNITS.includes(editItem?.unit as any) && !!editItem?.unit);
  const [costPrice, setCostPrice]     = useState(editItem ? String(editItem.costPrice) : "");
  const [sellingPrice, setSellingPrice] = useState(editItem ? String(editItem.sellingPrice) : "");
  const [lowStockAlert, setLowStockAlert] = useState(editItem?.lowStockAlert != null ? String(editItem.lowStockAlert) : "");
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: inventoryApi.getCategories,
  });

  const effectiveUnit = useCustomUnit ? customUnit : unit;

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof inventoryApi.createProduct>[0]) =>
      isEditMode ? inventoryApi.updateProduct(editItem!.id, data) : inventoryApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products-all"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      setShowSuccess(true);
      setTimeout(() => navigate("/inventory"), 900);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? (isEditMode ? "Failed to update product" : "Failed to save product");
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name required", description: "Enter a product name", variant: "destructive" });
      return;
    }
    if (!effectiveUnit.trim()) {
      toast({ title: "Unit required", description: "Select or enter a unit", variant: "destructive" });
      return;
    }
    const cost = parseFloat(costPrice);
    const sell = parseFloat(sellingPrice);
    if (isNaN(cost) || cost < 0) {
      toast({ title: "Invalid cost price", variant: "destructive" });
      return;
    }
    if (isNaN(sell) || sell < 0) {
      toast({ title: "Invalid selling price", variant: "destructive" });
      return;
    }
    mutation.mutate({
      name:          name.trim(),
      description:   description.trim() || undefined,
      sku:           sku.trim() || undefined,
      categoryId:    categoryId || undefined,
      unit:          effectiveUnit.trim(),
      costPrice:     cost,
      sellingPrice:  sell,
      lowStockAlert: lowStockAlert ? parseFloat(lowStockAlert) : undefined,
    });
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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
            <Package className="h-3.5 w-3.5 text-primary" />
          </div>
          <h1 className="text-lg font-bold leading-tight">{isEditMode ? "Edit Product" : "Add Product"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-4 pt-5 space-y-6">

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Product Name</label>
            <Input
              placeholder="e.g. Whole Wheat Bread"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              className="h-11"
              autoFocus={!isEditMode}
            />
          </div>

          <div className="h-px bg-border/60" />

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Category <span className="font-normal text-muted-foreground text-xs">(optional)</span>
            </label>
            <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-px bg-border/60" />

          {/* SKU */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              SKU / Code <span className="font-normal text-muted-foreground text-xs">(optional)</span>
            </label>
            <Input
              placeholder="e.g. BRD-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              maxLength={100}
              className="h-11"
            />
          </div>

          <div className="h-px bg-border/60" />

          {/* Unit */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Unit</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => { setUnit(u); setUseCustomUnit(false); }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-xs rounded-lg border font-medium transition-all",
                    !useCustomUnit && unit === u
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {!useCustomUnit && unit === u && <Check className="h-3 w-3 shrink-0" />}
                  {u}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseCustomUnit(true)}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-xs rounded-lg border font-medium transition-all",
                  useCustomUnit
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                {useCustomUnit && <Check className="h-3 w-3 shrink-0" />}
                Custom
              </button>
            </div>
            {useCustomUnit && (
              <Input
                placeholder="Enter unit (e.g. dozen, tray)"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                maxLength={50}
                className="h-10 mt-2"
                autoFocus
              />
            )}
          </div>

          <div className="h-px bg-border/60" />

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Cost Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold select-none">₹</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="pl-7 h-11"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Selling Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold select-none">₹</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="pl-7 h-11"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Low stock alert */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Low Stock Alert <span className="font-normal text-muted-foreground text-xs">(optional)</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 10"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(e.target.value)}
                className="h-11 pr-16"
              />
              {effectiveUnit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{effectiveUnit}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Alert shown when stock falls at or below this quantity.</p>
          </div>

          <div className="h-px bg-border/60" />

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Description <span className="font-normal text-muted-foreground text-xs">(optional)</span>
            </label>
            <Input
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="h-11"
            />
          </div>

        </div>
      </form>

      {/* Sticky submit */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border/60 z-30">
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold"
          disabled={mutation.isPending || isApiLoading}
          onClick={handleSubmit}
        >
          {mutation.isPending ? "Saving..." : isEditMode ? "Update Product" : "Save Product"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddProductPage;
