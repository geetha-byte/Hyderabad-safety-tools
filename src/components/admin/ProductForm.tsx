import { useState, type FormEvent } from "react";
import { ImagePlus, LoaderCircle, Save, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog";
import { saveProduct, type ProductInput } from "@/lib/products.functions";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const blank: ProductInput = {
  name: "", sku: "", category: "ppe", brand: "", description: "", price: 0, salePrice: null,
  images: [], stock: 0, sizes: [], material: "", colour: "", features: [], addedDays: 0, sold: 0, featured: false,
};

const field = "h-11 rounded-none bg-background";
const split = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export function ProductForm({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [form, setForm] = useState<ProductInput>(() => product ? {
    id: product.id, slug: product.slug, name: product.name, sku: product.sku, category: product.category,
    priceOnRequest: product.priceOnRequest ?? false,
    brand: product.brand, description: product.description, price: product.price, salePrice: product.salePrice ?? null,
    images: product.imagePaths ?? product.images, stock: product.stock, sizes: product.sizes ?? [], material: product.material,
    colour: product.colour, features: product.features, addedDays: product.addedDays, sold: product.sold, featured: !!product.featured,
  } : blank);
  const [previews, setPreviews] = useState<string[]>(product?.images ?? []);
  const [sizeText, setSizeText] = useState((product?.sizes ?? []).join(", "));
  const [featureText, setFeatureText] = useState((product?.features ?? []).join(", "));
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveProduct);
  const queryClient = useQueryClient();

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use JPG, PNG or WebP images only.");
        if (file.size > 5 * 1024 * 1024) throw new Error("Each image must be smaller than 5 MB.");
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = `${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        setForm((current) => ({ ...current, images: [...current.images, path] }));
        setPreviews((current) => [...current, URL.createObjectURL(file)]);
      }
      toast.success("Product photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo upload failed");
    } finally { setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.images.length) { toast.error("Add at least one product photo."); return; }
    if (form.salePrice !== null && form.salePrice > form.price) { toast.error("Sale price must not be higher than regular price."); return; }
    setBusy(true);
    try {
      await save({ data: { ...form, sizes: split(sizeText), features: split(featureText) } });
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["products"] }), queryClient.invalidateQueries({ queryKey: ["admin-products"] })]);
      toast.success(product ? "Product updated on the storefront" : "Product added to the storefront");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save product");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="product-name">Product name</Label><Input id="product-name" required minLength={2} value={form.name} onChange={(e) => set("name", e.target.value)} className={field} /></div>
        <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" required value={form.sku} onChange={(e) => set("sku", e.target.value)} className={field} placeholder="e.g. HST-FE-001" /></div>
        <div className="space-y-2"><Label htmlFor="brand">Brand</Label><Input id="brand" required value={form.brand} onChange={(e) => set("brand", e.target.value)} className={field} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="category">Category</Label><select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className="h-11 w-full rounded-none border border-input bg-background px-3 text-sm">{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="description">Description</Label><Textarea id="description" required minLength={10} rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} className="rounded-none bg-background" /></div>
        <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={form.priceOnRequest ?? false} onChange={(e) => { set("priceOnRequest", e.target.checked); if (e.target.checked) set("salePrice", null); }} />Price on request</label>
        <div className="space-y-2"><Label htmlFor="price">Regular price (₹)</Label><Input id="price" type="number" min="0" step="0.01" required disabled={form.priceOnRequest} value={form.price} onChange={(e) => set("price", e.target.valueAsNumber || 0)} className={field} /></div>
        <div className="space-y-2"><Label htmlFor="sale-price">Sale price (₹, optional)</Label><Input id="sale-price" type="number" min="0" step="0.01" disabled={form.priceOnRequest} value={form.salePrice ?? ""} onChange={(e) => set("salePrice", e.target.value === "" ? null : e.target.valueAsNumber)} className={field} /></div>
        <div className="space-y-2"><Label htmlFor="stock">Stock quantity</Label><Input id="stock" type="number" min="0" step="1" required value={form.stock} onChange={(e) => set("stock", e.target.valueAsNumber || 0)} className={field} /></div>
        <div className="space-y-2"><Label htmlFor="sold">Units sold</Label><Input id="sold" type="number" min="0" step="1" required value={form.sold} onChange={(e) => set("sold", e.target.valueAsNumber || 0)} className={field} /></div>
        <div className="space-y-2"><Label htmlFor="material">Material</Label><Input id="material" value={form.material} onChange={(e) => set("material", e.target.value)} className={field} /></div>
        <div className="space-y-2"><Label htmlFor="colour">Colours (optional)</Label><Input id="colour" placeholder="Red, Yellow, Blue" maxLength={80} value={form.colour} onChange={(e) => set("colour", e.target.value)} className={field} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="sizes">Sizes (optional)</Label><Input id="sizes" value={sizeText} onChange={(e) => setSizeText(e.target.value)} className={field} placeholder="S, M, L, XL or 6, 7, 8, 9" /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="features">Features, separated by commas</Label><Textarea id="features" rows={3} value={featureText} onChange={(e) => setFeatureText(e.target.value)} className="rounded-none bg-background" placeholder="Steel toe cap, Oil-resistant sole" /></div>
      </div>

      <div className="space-y-3"><Label>Product photos</Label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map((image, index) => <div key={`${form.images[index]}-${index}`} className="relative aspect-square border border-border bg-product-surface"><img src={image} alt={`Product ${index + 1}`} className="h-full w-full object-contain p-2" /><Button type="button" variant="destructive" size="icon" aria-label={`Remove photo ${index + 1}`} onClick={() => { set("images", form.images.filter((_, i) => i !== index)); setPreviews(previews.filter((_, i) => i !== index)); }} className="absolute right-1 top-1 h-7 w-7"><X className="h-4 w-4" /></Button></div>)}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-input bg-background text-center text-xs text-muted-foreground hover:border-accent"><ImagePlus className="h-6 w-6 text-accent" />Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={busy} /></label>
        </div><p className="text-xs text-muted-foreground">JPG, PNG or WebP. Up to 5 MB each.</p>
      </div>

      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-accent" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />Feature this product on the home page</label>
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onClose} className="rounded-none">Cancel</Button><Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90">{busy ? <LoaderCircle className="animate-spin" /> : <Save />}{product ? "Save changes" : "Add product"}</Button></div>
    </form>
  );
}
