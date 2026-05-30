import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { inventoryApi } from "@/api/inventory";
import type { Product, ProductCategory, StockTransaction } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import DateRangeFilter from "@/components/DateRangeFilter";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import {
  Plus, Package, ChevronLeft, ChevronRight, Search, X,
  Pencil, Trash2, TrendingUp, TrendingDown, Tag,
  AlertTriangle, Check, PowerOff, Power,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "Products" | "Transactions" | "Summary";

const PAGE_SIZE = 20;

// ── Stock badge ──────────────────────────────────────────────────────────────
const StockBadge = ({ product }: { product: Product }) => {
  if (product.currentStock === 0)
    return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">Out of stock</span>;
  if (product.lowStockAlert != null && product.currentStock <= product.lowStockAlert)
    return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Low stock</span>;
  return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-income/10 text-income">In stock</span>;
};

const InventoryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const [tab, setTab] = useState<Tab>("Products");

  // ── Products tab state ────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [categoryId, setCategoryId]   = useState("");
  const [productsPage, setProductsPage] = useState(1);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState<Product | null>(null);

  // Category sheet state
  const [editingCatId, setEditingCatId]   = useState<string | null>(null);
  const [editCatName, setEditCatName]     = useState("");
  const [newCatName, setNewCatName]       = useState("");
  const [showAddCat, setShowAddCat]       = useState(false);
  const [pendingDeleteCat, setPendingDeleteCat] = useState<ProductCategory | null>(null);

  // ── Transactions tab state ────────────────────────────────────────────────
  const [startDate, setStartDate]       = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate]           = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [filterProductId, setFilterProductId] = useState("");
  const [txType, setTxType]             = useState("");
  const [txPage, setTxPage]             = useState(1);
  const [pendingDeleteTx, setPendingDeleteTx] = useState<StockTransaction | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setProductsPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: categories = [] } = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: inventoryApi.getCategories,
  });

  const { data: productsData, isLoading: productsLoading, isFetching: productsFetching } = useQuery({
    queryKey: ["inventory-products", search, categoryId, productsPage],
    queryFn: () => inventoryApi.getProducts({ search: search || undefined, categoryId: categoryId || undefined, page: productsPage, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    enabled: tab === "Products",
  });

  const { data: allProductsList = [] } = useQuery({
    queryKey: ["inventory-products-all"],
    queryFn: () => inventoryApi.getProducts({ pageSize: 500 }).then((r) => r.items),
    enabled: tab === "Transactions",
  });

  const { data: txData, isLoading: txLoading, isFetching: txFetching } = useQuery({
    queryKey: ["inventory-transactions", filterProductId, txType, startDate, endDate, txPage],
    queryFn: () => inventoryApi.getTransactions({ productId: filterProductId || undefined, type: txType || undefined, startDate, endDate, page: txPage, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    enabled: tab === "Transactions",
  });

  const { data: summary } = useQuery({
    queryKey: ["inventory-summary"],
    queryFn: inventoryApi.getSummary,
    enabled: tab === "Summary",
  });

  const { data: lowStockList = [] } = useQuery({
    queryKey: ["inventory-low-stock"],
    queryFn: inventoryApi.getLowStock,
    enabled: tab === "Summary",
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-products-all"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] });
  };

  // ── Product mutations ─────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => inventoryApi.setProductStatus(id, isActive),
    onSuccess: (_, { isActive }) => {
      invalidateAll();
      toast({ title: isActive ? "Product activated" : "Product deactivated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update product status", variant: "destructive" }),
  });

  // ── Transaction mutations ─────────────────────────────────────────────────
  const deleteTxMutation = useMutation({
    mutationFn: inventoryApi.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      invalidateAll();
      toast({ title: "Deleted", description: "Transaction removed and stock reversed" });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? "Failed to delete transaction";
      toast({ title: "Cannot Delete", description: message, variant: "destructive" });
    },
  });

  // ── Category mutations ────────────────────────────────────────────────────
  const addCatMutation = useMutation({
    mutationFn: inventoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
      setNewCatName(""); setShowAddCat(false);
      toast({ title: "Category added" });
    },
    onError: (error: any) => toast({ title: "Error", description: error?.response?.data?.message ?? "Failed to add category", variant: "destructive" }),
  });

  const renameCatMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => inventoryApi.updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      setEditingCatId(null);
      toast({ title: "Category renamed" });
    },
    onError: (error: any) => toast({ title: "Error", description: error?.response?.data?.message ?? "Failed to rename category", variant: "destructive" }),
  });

  const deleteCatMutation = useMutation({
    mutationFn: inventoryApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (error: any) => toast({ title: "Cannot Delete", description: error?.response?.data?.message ?? "Failed to delete category", variant: "destructive" }),
  });

  const products    = productsData?.items ?? [];
  const productsTotalPages = productsData?.totalPages ?? 1;
  const productsTotalCount = productsData?.totalCount ?? 0;

  const txItems      = txData?.items ?? [];
  const txTotalPages = txData?.totalPages ?? 1;
  const txTotalCount = txData?.totalCount ?? 0;
  const txTotalAmount = txData?.totalAmount ?? 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Inventory" subtitle="Products & stock" />

      <div className="space-y-4 px-4 pt-2">

        {/* Tab selector */}
        <div className="grid grid-cols-3 rounded-xl border border-border bg-muted/40 p-1 gap-1">
          {(["Products", "Transactions", "Summary"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg py-2 text-xs font-semibold transition-all",
                tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Products tab ──────────────────────────────────────────────── */}
        {tab === "Products" && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-9 h-10"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Category filter chips */}
            {categories.length > 0 && (
              <div className="flex gap-1.5 flex-wrap items-center">
                <button
                  onClick={() => { setCategoryId(""); setProductsPage(1); }}
                  className={cn("px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all",
                    categoryId === "" ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background text-muted-foreground border-border hover:border-primary/40")}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setCategoryId((prev) => prev === c.id ? "" : c.id); setProductsPage(1); }}
                    className={cn("px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all",
                      categoryId === c.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background text-muted-foreground border-border hover:border-primary/40")}
                  >
                    {c.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowCategorySheet(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground transition-all"
                >
                  <Tag className="h-3 w-3" /> Manage
                </button>
              </div>
            )}

            {categories.length === 0 && (
              <button
                onClick={() => setShowCategorySheet(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground transition-all"
              >
                <Tag className="h-3 w-3" /> Add categories
              </button>
            )}

            <Button className="w-full" onClick={() => navigate("/inventory/products/add")} disabled={isApiLoading}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>

            <Card className={cn("transition-opacity duration-200", productsFetching && !productsLoading && "opacity-60")}>
              <CardContent className="divide-y divide-border py-0">
                {productsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-xl" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))
                ) : products.length === 0 ? (
                  <EmptyState message="No products found" />
                ) : (
                  <>
                    {products.map((p) => (
                      <div key={p.id} className={cn("flex items-center justify-between py-3 px-1 -mx-1 rounded-lg hover:bg-muted/40 transition-colors", !p.isActive && "opacity-50")}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                              <StockBadge product={p} />
                              {!p.isActive && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Inactive</span>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {p.categoryName ? `${p.categoryName} · ` : ""}{p.currentStock} {p.unit}
                              {p.sku ? ` · ${p.sku}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Cost ₹{p.costPrice.toLocaleString("en-IN")} · Sell ₹{p.sellingPrice.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => navigate("/inventory/products/edit", { state: { item: p } })} disabled={isApiLoading}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className={cn("h-8 w-8", p.isActive ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:text-income")}
                            onClick={() => setPendingDeactivate(p)} disabled={statusMutation.isPending || isApiLoading}>
                            {p.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {productsTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-3 pb-2">
                        <span className="text-xs text-muted-foreground">Page {productsPage} of {productsTotalPages} · {productsTotalCount} products</span>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setProductsPage((p) => Math.max(1, p - 1))} disabled={productsPage === 1 || productsFetching}>
                            <ChevronLeft className="h-3 w-3" /> Prev
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setProductsPage((p) => Math.min(productsTotalPages, p + 1))} disabled={productsPage === productsTotalPages || productsFetching}>
                            Next <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Transactions tab ──────────────────────────────────────────── */}
        {tab === "Transactions" && (
          <>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onDateChange={(s, e) => { setStartDate(s); setEndDate(e); setTxPage(1); }}
            />

            {/* Product filter */}
            <Select value={filterProductId || "all"} onValueChange={(v) => { setFilterProductId(v === "all" ? "" : v); setTxPage(1); }}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {allProductsList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type filter */}
            <div className="flex gap-1.5">
              {["", "Purchase", "Sale"].map((t) => (
                <button
                  key={t || "all"}
                  onClick={() => { setTxType(t); setTxPage(1); }}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all",
                    txType === t
                      ? t === "Purchase" ? "bg-income text-white border-income shadow-sm"
                        : t === "Sale" ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  {t || "All"}
                </button>
              ))}
            </div>

            {txTotalCount > 0 && (
              <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardContent className="py-3">
                  <p className="text-xs font-medium text-muted-foreground">Total · {txTotalCount} entries</p>
                  <p className="text-2xl font-bold text-primary mt-0.5">₹{txTotalAmount.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
            )}

            <Button className="w-full" onClick={() => navigate("/inventory/transactions/add")} disabled={isApiLoading}>
              <Plus className="mr-2 h-4 w-4" /> Record Transaction
            </Button>

            <Card className={cn("transition-opacity duration-200", txFetching && !txLoading && "opacity-60")}>
              <CardContent className="divide-y divide-border py-0">
                {txLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-xl" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-36" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))
                ) : txItems.length === 0 ? (
                  <EmptyState message="No transactions found" />
                ) : (
                  <>
                    {txItems.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-3 px-1 -mx-1 rounded-lg hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tx.type === "Purchase" ? "bg-income/10" : "bg-primary/10")}>
                            {tx.type === "Purchase"
                              ? <TrendingUp className="h-4 w-4 text-income" />
                              : <TrendingDown className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate">{tx.productName}</p>
                              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0",
                                tx.type === "Purchase" ? "bg-income/10 text-income" : "bg-primary/10 text-primary")}>
                                {tx.type}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {tx.quantity} {tx.productUnit} · ₹{tx.unitPrice}/unit
                              {tx.supplierOrCustomer ? ` · ${tx.supplierOrCustomer}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })}
                              {tx.paymentMethod ? ` · ${tx.paymentMethod}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={cn("text-sm font-semibold mr-1", tx.type === "Purchase" ? "text-income" : "text-primary")}>
                            ₹{tx.totalAmount.toLocaleString("en-IN")}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setPendingDeleteTx(tx)} disabled={deleteTxMutation.isPending || isApiLoading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {txTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-3 pb-2">
                        <span className="text-xs text-muted-foreground">Page {txPage} of {txTotalPages} · {txTotalCount} entries</span>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setTxPage((p) => Math.max(1, p - 1))} disabled={txPage === 1 || txFetching}>
                            <ChevronLeft className="h-3 w-3" /> Prev
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))} disabled={txPage === txTotalPages || txFetching}>
                            Next <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Summary tab ───────────────────────────────────────────────── */}
        {tab === "Summary" && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground font-medium">Total Products</p>
                  <p className="text-2xl font-bold text-primary mt-0.5">{summary?.totalProducts ?? "—"}</p>
                </CardContent>
              </Card>
              <Card className="border-income/20 bg-income/5">
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground font-medium">Inventory Value</p>
                  <p className="text-xl font-bold text-income mt-0.5">
                    {summary ? `₹${summary.totalInventoryValue.toLocaleString("en-IN")}` : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground font-medium">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-0.5">{summary?.lowStockCount ?? "—"}</p>
                </CardContent>
              </Card>
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground font-medium">Out of Stock</p>
                  <p className="text-2xl font-bold text-destructive mt-0.5">{summary?.outOfStockCount ?? "—"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Today's sales */}
            {summary && (
              <Card className="shadow-sm">
                <CardContent className="py-3">
                  <p className="text-xs font-medium text-muted-foreground">Today's Sales</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">₹{summary.todaySalesAmount.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{summary.todaySalesCount} transaction{summary.todaySalesCount !== 1 ? "s" : ""}</p>
                </CardContent>
              </Card>
            )}

            {/* Low stock list */}
            {lowStockList.length > 0 && (
              <Card className="shadow-sm">
                <CardContent className="py-0">
                  <div className="flex items-center gap-2 pt-3 pb-2 border-b border-border">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <p className="text-sm font-semibold">Low Stock Alert</p>
                  </div>
                  <div className="divide-y divide-border">
                    {lowStockList.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.categoryName ?? "No category"}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-sm font-bold", p.currentStock === 0 ? "text-destructive" : "text-yellow-600 dark:text-yellow-400")}>
                            {p.currentStock} {p.unit}
                          </p>
                          {p.lowStockAlert != null && (
                            <p className="text-xs text-muted-foreground">alert at {p.lowStockAlert}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {/* ── Category management sheet ──────────────────────────────────── */}
      <Sheet open={showCategorySheet} onOpenChange={setShowCategorySheet}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="pb-3">
            <SheetTitle>Manage Categories</SheetTitle>
          </SheetHeader>

          <div className="space-y-3">
            {showAddCat ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  maxLength={100}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") addCatMutation.mutate(newCatName.trim()); if (e.key === "Escape") { setShowAddCat(false); setNewCatName(""); } }}
                  disabled={addCatMutation.isPending}
                />
                <Button size="icon" onClick={() => addCatMutation.mutate(newCatName.trim())} disabled={addCatMutation.isPending || !newCatName.trim()}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { setShowAddCat(false); setNewCatName(""); }} disabled={addCatMutation.isPending}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowAddCat(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            )}

            {categories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No categories yet.</p>
            ) : (
              <div className="divide-y divide-border border rounded-lg">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2.5">
                    {editingCatId === c.id ? (
                      <>
                        <Input
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="h-8 text-sm"
                          maxLength={100}
                          autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") renameCatMutation.mutate({ id: c.id, name: editCatName.trim() }); if (e.key === "Escape") setEditingCatId(null); }}
                          disabled={renameCatMutation.isPending}
                        />
                        <div className="flex gap-1 ml-2">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => renameCatMutation.mutate({ id: c.id, name: editCatName.trim() })} disabled={renameCatMutation.isPending || !editCatName.trim()}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCatId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium">{c.name}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => { setEditingCatId(c.id); setEditCatName(c.name); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setPendingDeleteCat(c)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Deactivate/activate confirm */}
      <AlertDialog open={!!pendingDeactivate} onOpenChange={(open) => { if (!open) setPendingDeactivate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingDeactivate?.isActive ? "Deactivate" : "Activate"} Product?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium text-foreground">Product:</span> {pendingDeactivate?.name}</p>
                {pendingDeactivate?.isActive
                  ? <p className="text-muted-foreground pt-1">The product will be hidden from active listings. Transaction history is preserved.</p>
                  : <p className="text-muted-foreground pt-1">The product will be visible and usable again.</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={pendingDeactivate?.isActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() => { statusMutation.mutate({ id: pendingDeactivate!.id, isActive: !pendingDeactivate!.isActive }); setPendingDeactivate(null); }}
            >
              {pendingDeactivate?.isActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete category confirm */}
      <AlertDialog open={!!pendingDeleteCat} onOpenChange={(open) => { if (!open) setPendingDeleteCat(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm">
                <p><span className="font-medium text-foreground">Category:</span> {pendingDeleteCat?.name}</p>
                <p className="pt-1 text-muted-foreground">Deletion will be blocked if products are linked to this category.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { deleteCatMutation.mutate(pendingDeleteCat!.id); setPendingDeleteCat(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete transaction confirm */}
      <AlertDialog open={!!pendingDeleteTx} onOpenChange={(open) => { if (!open) setPendingDeleteTx(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium text-foreground">Product:</span> {pendingDeleteTx?.productName}</p>
                <p><span className="font-medium text-foreground">Type:</span> {pendingDeleteTx?.type}</p>
                <p><span className="font-medium text-foreground">Qty:</span> {pendingDeleteTx?.quantity} {pendingDeleteTx?.productUnit}</p>
                <p><span className="font-medium text-foreground">Amount:</span> ₹{pendingDeleteTx?.totalAmount.toLocaleString("en-IN")}</p>
                <p className="pt-1 text-destructive">Stock will be reversed. This cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { deleteTxMutation.mutate(pendingDeleteTx!.id); setPendingDeleteTx(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryPage;
