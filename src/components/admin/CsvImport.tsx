import { useState } from "react";
import { Download, FileUp, LoaderCircle, Upload } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categoryName, inr } from "@/lib/catalog";
import { parseProductCsv, findImportDuplicates, productCsvTemplate, categoryCsv, type CsvPreview } from "@/lib/product-csv";
import { importLocalProductCsv } from "@/lib/local-products.functions";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  URL.revokeObjectURL(url);
}

export function CsvImport({
  existing,
  categories,
}: {
  existing: { sku: string; slug: string }[];
  categories: { slug: string; name: string }[];
}) {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const importCsv = useServerFn(importLocalProductCsv);
  const queryClient = useQueryClient();
  const errors = preview ? [...preview.errors, ...findImportDuplicates(preview.rows, existing)] : [];

  async function choose(file: File | undefined) {
    setCount(null); setPreview(null); setCsv("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setPreview({ rows: [], errors: [{ row: 0, message: "CSV must be 5 MB or smaller." }] }); return; }
    setBusy(true);
    try { const text = await file.text(); setCsv(text); setPreview(parseProductCsv(text, categories)); }
    catch { toast.error("Could not read this file. Choose a CSV file."); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!preview?.rows.length || errors.length || busy) return;
    setBusy(true);
    try {
      const result = await importCsv({ data: { csv } });
      if (result.errors.length) { setPreview({ rows: preview.rows, errors: result.errors }); return; }
      setCount(result.count); setPreview(null); setCsv("");
      toast.success(`${result.count} products imported`);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["products"] }), queryClient.invalidateQueries({ queryKey: ["admin-products"] })]);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Import failed. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => download("safety-products-template.csv", productCsvTemplate())}><Download />Product template</Button>
      <Button variant="outline" onClick={() => download("safety-product-categories.csv", categoryCsv(categories) )}><Download />Category list</Button>
    </div>
    <div className="space-y-2"><Label htmlFor="product-csv">Products CSV · up to 500 products, 5 MB</Label><Input id="product-csv" type="file" accept=".csv,text/csv" disabled={busy} onChange={(e) => { void choose(e.target.files?.[0]); e.target.value = ""; }} /></div>
    <dl className="grid gap-x-4 gap-y-2 border-y border-border py-3 text-sm sm:grid-cols-[auto_1fr]">
      <dt className="font-semibold">Prices</dt><dd className="text-muted-foreground">₹ · numbers only</dd>
      <dt className="font-semibold">Images</dt><dd className="text-muted-foreground">HTTPS links separated by |</dd>
      <dt className="font-semibold">Sizes & colours</dt><dd className="text-muted-foreground">Optional · separated by | or commas</dd>
      <dt className="font-semibold">Import mode</dt><dd className="text-muted-foreground">New products only · existing products unchanged</dd>
    </dl>
    {count !== null && <p role="status" className="font-semibold text-success">{count} products added to your storefront.</p>}
    {busy && <p role="status" className="flex items-center gap-2 text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Processing…</p>}
    {preview && <>
      {errors.length > 0 ? <div role="alert" className="space-y-2 border border-destructive/40 p-4"><p className="font-semibold text-destructive">Nothing imported · {errors.length} errors</p><ul className="max-h-40 space-y-1 overflow-y-auto text-sm">{errors.map((error, index) => <li key={index}>{error.row ? `Row ${error.row}: ` : ""}{error.message}</li>)}</ul></div> : <p className="font-semibold">{preview.rows.length} products ready to import</p>}
      {preview.rows.length > 0 && <div className="max-h-72 overflow-auto border border-border"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-muted"><tr>{["Row", "Product / SKU", "Price", "Options"].map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{preview.rows.map(({ row, product }) => <tr key={row} className="border-t border-border"><td className="p-3">{row}</td><td className="p-3"><span className="block font-semibold">{product.name}</span><span className="text-xs text-muted-foreground">{product.sku} · {categoryName(product.category)}</span></td><td className="whitespace-nowrap p-3">{inr(product.salePrice ?? product.price)}</td><td className="p-3">{[product.sizes.join(", "), product.colour].filter(Boolean).join(" · ") || "—"}</td></tr>)}</tbody></table></div>}
      <Button disabled={busy || errors.length > 0 || !preview.rows.length} onClick={submit} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">{busy ? <LoaderCircle className="animate-spin" /> : <Upload />}Import {preview.rows.length} products</Button>
    </>}
    {!preview && count === null && !busy && <FileUp className="mx-auto h-10 w-10 text-muted-foreground" />}
  </div>;
}
