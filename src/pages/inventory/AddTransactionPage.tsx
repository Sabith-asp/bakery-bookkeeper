import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { inventoryApi } from "@/api/inventory";
import { divisionApi } from "@/api/division";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import BottomNav from "@/components/BottomNav";
import DatePickerDrawer from "@/components/DatePickerDrawer";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { useAuth } from "@/context/AuthContext";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import { ArrowLeft, TrendingDown, TrendingUp, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import SaveSuccessOverlay from "@/components/SaveSuccessOverlay";

type TxType = "Purchase" | "Sale";

const AddTransactionPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();
  const { hasModule } = useAuth();

  const [txType, setTxType]                         = useState<TxType>("Purchase");
  const [productId, setProductId]                   = useState("");
  const [productOpen, setProductOpen]               = useState(false);
  const [quantity, setQuantity]                     = useState("");
  const [unitPrice, setUnitPrice]                   = useState("");
  const [supplierOrCustomer, setSupplierOrCustomer] = useState("");
  const [paymentMethod, setPaymentMethod]           = useState("");
  const [divisionId, setDivisionId]                 = useState("");
  const [note, setNote]                             = useState("");
  const [date, setDate]                             = useState(format(new Date(), "yyyy-MM-dd"));
  const [showSuccess, setShowSuccess]               = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ["inventory-products-all"],
    queryFn: () => inventoryApi.getProducts({ pageSize: 500 }).then((r) => r.items),
  });
  const products = productsData ?? [];

  const { data: divisions = [] } = useQuery({
    queryKey: ["division"],
    queryFn: divisionApi.getAll,
    enabled: hasModule("Divisions"),
  });

  const selectedProduct = products.find((p) => p.id === productId);

  // Pre-fill unit price when product or type changes
  useEffect(() => {
    if (!selectedProduct) return;
    setUnitPrice(txType === "Purchase"
      ? String(selectedProduct.costPrice)
      : String(selectedProduct.sellingPrice));
  }, [productId, txType, selectedProduct]);

  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  const mutation = useMutation({
    mutationFn: inventoryApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products-all"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] });
      setShowSuccess(true);
      setTimeout(() => navigate("/inventory"), 900);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? "Failed to save transaction";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId) {
      toast({ title: "Product required", description: "Select a product", variant: "destructive" });
      return;
    }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      toast({ title: "Invalid quantity", description: "Quantity must be greater than 0", variant: "destructive" });
      return;
    }
    const price = parseFloat(unitPrice);
    if (isNaN(price) || price < 0) {
      toast({ title: "Invalid unit price", variant: "destructive" });
      return;
    }
    if (txType === "Sale" && selectedProduct && qty > selectedProduct.currentStock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${selectedProduct.currentStock} ${selectedProduct.unit} available.`,
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      productId,
      type:               txType,
      quantity:           qty,
      unitPrice:          price,
      supplierOrCustomer: supplierOrCustomer.trim() || undefined,
      paymentMethod:      paymentMethod || undefined,
      divisionId:         divisionId || undefined,
      note:               note.trim() || undefined,
      date,
    });
  };

  const isPurchase = txType === "Purchase";

  return (
    <div className="min-h-screen bg-background pb-40">
      <SaveSuccessOverlay show={showSuccess} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 lg:px-8 pt-5 pb-3 border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <Button variant="ghost" size="icon" className="h-11 w-11 md:h-10 md:w-10 rounded-full shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", isPurchase ? "bg-income/15" : "bg-primary/15")}>
            {isPurchase
              ? <TrendingUp className="h-3.5 w-3.5 text-income" />
              : <TrendingDown className="h-3.5 w-3.5 text-primary" />}
          </div>
          <h1 className="text-lg font-bold leading-tight">Record Transaction</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-4 pt-5 space-y-6 md:px-6 lg:max-w-2xl lg:mx-auto">

          {/* Type toggle */}
          <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/40 p-1 gap-1">
            {(["Purchase", "Sale"] as TxType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxType(t)}
                className={cn(
                  "rounded-lg py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5",
                  txType === t
                    ? t === "Purchase"
                      ? "bg-income text-white shadow-sm"
                      : "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "Purchase"
                  ? <TrendingUp className="h-3.5 w-3.5" />
                  : <TrendingDown className="h-3.5 w-3.5" />}
                {t}
              </button>
            ))}
          </div>

          <div className="h-px bg-border/60" />

          {/* Product */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Product</label>
            <Popover open={productOpen} onOpenChange={setProductOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productOpen}
                  className="w-full h-11 justify-between font-normal"
                >
                  <span className={cn("truncate", !selectedProduct && "text-muted-foreground")}>
                    {selectedProduct
                      ? `${selectedProduct.name}${selectedProduct.sku ? ` (${selectedProduct.sku})` : ""}`
                      : "Select a product"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search product..." className="h-10" />
                  <CommandList>
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandGroup>
                      {products.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.name} ${p.sku ?? ""}`}
                          onSelect={() => {
                            setProductId(p.id);
                            setProductOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4 shrink-0", productId === p.id ? "opacity-100" : "opacity-0")} />
                          <span className="flex-1 truncate">
                            {p.name}{p.sku ? <span className="ml-1 text-xs text-muted-foreground">({p.sku})</span> : null}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground shrink-0">{p.currentStock} {p.unit}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedProduct && (
              <p className={cn(
                "text-xs font-medium mt-1",
                selectedProduct.currentStock === 0
                  ? "text-destructive"
                  : selectedProduct.lowStockAlert && selectedProduct.currentStock <= selectedProduct.lowStockAlert
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-muted-foreground"
              )}>
                Current stock: {selectedProduct.currentStock} {selectedProduct.unit}
              </p>
            )}
          </div>

          <div className="h-px bg-border/60" />

          {/* Quantity + Unit Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                Quantity {selectedProduct && <span className="font-normal text-muted-foreground text-xs">({selectedProduct.unit})</span>}
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Unit Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold select-none">₹</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="pl-7 h-11"
                />
              </div>
            </div>
          </div>

          {/* Total */}
          {totalAmount > 0 && (
            <div className="rounded-lg bg-muted/50 border border-border/60 px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total Amount</span>
              <span className="text-base font-bold text-foreground">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="h-px bg-border/60" />

          {/* Supplier / Customer */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              {isPurchase ? "Supplier" : "Customer"}{" "}
              <span className="font-normal text-muted-foreground text-xs">(optional)</span>
            </label>
            <Input
              placeholder={isPurchase ? "e.g. ABC Suppliers" : "e.g. John Doe"}
              value={supplierOrCustomer}
              onChange={(e) => setSupplierOrCustomer(e.target.value)}
              maxLength={200}
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
                    "flex items-center gap-1 px-3 py-2 md:px-3.5 md:py-2.5 text-xs rounded-lg border font-medium transition-all",
                    paymentMethod === m
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
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

          {/* Note */}
          <div className="h-px bg-border/60" />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Note <span className="font-normal text-muted-foreground text-xs">(optional)</span>
            </label>
            <Input
              placeholder="Any additional notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="h-11"
            />
          </div>

        </div>
      </form>

      {/* Sticky submit */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-2 md:px-6 bg-background/95 backdrop-blur-sm border-t border-border/60 z-30">
        <div className="lg:max-w-2xl lg:mx-auto">
          <Button
            type="submit"
            className={cn("w-full h-12 text-base font-semibold", isPurchase ? "bg-income hover:bg-income/90 text-white" : "")}
            disabled={mutation.isPending || isApiLoading}
            onClick={handleSubmit}
          >
            {mutation.isPending ? "Saving..." : `Record ${txType}`}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddTransactionPage;
