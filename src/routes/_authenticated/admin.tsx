import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Boxes, Edit, ExternalLink, FileUp, LoaderCircle, LogOut, PackagePlus, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { deleteLocalProduct, listLocalAdminProducts } from "@/lib/local-products.functions";
import {
  listLocalAdminCategories,
  createLocalCategoryFn,
  updateLocalCategoryFn,
  setLocalCategoryStatusFn,
  deleteLocalCategoryFn,
} from "@/lib/local-categories.functions";
import { productPriceLabel, type Product } from "@/lib/catalog";
import { localLogout } from "@/lib/local-auth-api.functions";
import { ProductForm } from "@/components/admin/ProductForm";
import { CsvImport } from "@/components/admin/CsvImport";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Product Manager – Hyderabad Safety Tools" },
    { name: "description", content: "Add, edit and remove products from the Hyderabad Safety Tools storefront." },
    { property: "og:title", content: "Product Manager – Hyderabad Safety Tools" },
    { property: "og:description", content: "Secure store product management." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: AdminPage,
});

function AdminPage() {
  const fetchProducts = useServerFn(listLocalAdminProducts);
  const createCategory = useServerFn(createLocalCategoryFn);
const updateCategory = useServerFn(updateLocalCategoryFn);
const changeCategoryStatus = useServerFn(setLocalCategoryStatusFn);
const removeCategory = useServerFn(deleteLocalCategoryFn);
  const fetchCategories = useServerFn(listLocalAdminCategories);
  const removeProduct = useServerFn(deleteLocalProduct);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: products, isLoading, error } = useQuery({ queryKey: ["admin-products"], queryFn: () => fetchProducts() });
  const {
  data: categories = [],
  isLoading: categoriesLoading,
  error: categoriesError,
} = useQuery({
  queryKey: ["admin-categories"],
  queryFn: () => fetchCategories(),
});
  const [editor, setEditor] = useState<{ product: Product | null } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
const [editingCategory, setEditingCategory] = useState<{
  id: string;
  name: string;
  description: string;
} | null>(null);
const [categoryName, setCategoryName] = useState("");
const [categoryDescription, setCategoryDescription] = useState("");
const [categorySaving, setCategorySaving] = useState(false);
const [categoriesExpanded, setCategoriesExpanded] = useState(false);
const [productSearch, setProductSearch] = useState("");
const [categoryFilter, setCategoryFilter] = useState("all");
const [stockFilter, setStockFilter] = useState("all");
  const filteredProducts = (products ?? []).filter((product) => {
    const search = productSearch.trim().toLowerCase();

    const matchesSearch =
      !search ||
      [product.name, product.sku, product.brand].some((value) =>
        String(value ?? "").toLowerCase().includes(search),
      );

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in-stock" ? product.stock > 0 : product.stock <= 0);

    return matchesSearch && matchesCategory && matchesStock;
  });
  async function signOut() {
  await queryClient.cancelQueries();
  queryClient.clear();
  await localLogout();
  navigate({ to: "/auth", replace: true });
  }
  async function confirmDelete(id: string) {
    setDeleting(true);
    try {
      await removeProduct({ data: { id } });
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["products"] }), queryClient.invalidateQueries({ queryKey: ["admin-products"] })]);
      toast.success("Product removed from the storefront");
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Could not delete product");
    } finally { setDeleting(false); }
  }
    function openNewCategory() {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryDialogOpen(true);
  }

  function openEditCategory(category: {
    id: string;
    name: string;
    description: string;
  }) {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description);
    setCategoryDialogOpen(true);
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategorySaving(true);

    try {
      const data = {
        name: categoryName.trim(),
        description: categoryDescription.trim(),
      };

      if (editingCategory) {
        await updateCategory({ data: { ...data, id: editingCategory.id } });
        toast.success("Category updated successfully");
      } else {
        await createCategory({ data });
        toast.success("Category created successfully");
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategoryDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save category");
    } finally {
      setCategorySaving(false);
    }
  }
  async function toggleCategory(category: {
    id: string;
    is_active: boolean;
  }) {
    try {
      await changeCategoryStatus({
        data: {
          id: category.id,
          isActive: !category.is_active,
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });

      toast.success(
        category.is_active ? "Category deactivated" : "Category activated",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update category");
    }
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await removeCategory({ data: { id } });

      await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });

      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete category");
    }
  }
  return (
    <div className="min-h-screen bg-navy-deep">
      <header className="border-b border-border bg-card">
        <div className="container-x flex min-h-20 flex-wrap items-center gap-4 py-4">
          <Link to="/admin" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center bg-accent-gradient"><ShieldCheck className="text-accent-foreground" /></span><span><span className="block font-extrabold">Product Manager</span><span className="block text-xs uppercase tracking-widest text-accent">Hyderabad Safety Tools</span></span></Link>
          <nav className="ml-auto flex flex-wrap items-center gap-2"><Button asChild variant="outline" className="rounded-none"><Link to="/admin-users"><Users />Users & roles</Link></Button><Button asChild variant="outline" className="rounded-none"><Link to="/" target="_blank">View storefront<ExternalLink /></Link></Button><Button variant="ghost" onClick={signOut} className="rounded-none"><LogOut />Sign out</Button></nav>
        </div>
      </header>
      <main className="container-x py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Store catalogue</p><h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Products</h1><p className="mt-2 text-sm text-muted-foreground">Changes are saved online and applied to the storefront.</p></div>
          {!error && <div className="flex flex-wrap gap-2"><Button disabled={isLoading} variant="outline" onClick={() => setImportOpen(true)} className="h-12 rounded-none"><FileUp />Import CSV</Button><Button onClick={() => setEditor({ product: null })} className="h-12 rounded-none bg-accent px-6 font-bold text-accent-foreground hover:bg-accent/90"><PackagePlus />Add product</Button></div>}
        </div>

        {isLoading ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-accent" /><span className="sr-only">Loading products</span></div> : error ? (
          <div className="mt-10 border border-destructive/40 bg-card p-8 text-center"><h2 className="text-xl font-bold">Admin access required</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">This signed-in account is not the approved store admin. Sign in with manojenterprisesinfo@gmail.com after its account has been created.</p><Button onClick={signOut} variant="outline" className="mt-6 rounded-none">Sign in with another account</Button></div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3"><div className="border border-border bg-card p-5"><Boxes className="text-accent" /><p className="mt-3 text-3xl font-bold">{products?.length ?? 0}</p><p className="text-sm text-muted-foreground">Total products</p></div><div className="border border-border bg-card p-5"><PackagePlus className="text-accent" /><p className="mt-3 text-3xl font-bold">{products?.filter((p) => p.stock > 0).length ?? 0}</p><p className="text-sm text-muted-foreground">In stock</p></div><div className="col-span-2 border border-border bg-card p-5 sm:col-span-1"><ShieldCheck className="text-accent" /><p className="mt-3 text-3xl font-bold">{products?.filter((p) => p.featured).length ?? 0}</p><p className="text-sm text-muted-foreground">Featured</p></div></div>
                          <section className="mt-10 border border-border bg-card p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Product Categories</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage the categories used by your products.
                  </p>
                </div>
                <Button onClick={openNewCategory}>
                  Add Category
                </Button>
              </div>
              <div className="mb-4">
  <Button
    type="button"
    variant="outline"
    onClick={() => setCategoriesExpanded((expanded) => !expanded)}
  >
    {categoriesExpanded ? "Hide Categories" : `Show Categories (${categories.length})`}
  </Button>
</div>

{categoriesExpanded && (
  <div>
              {categoriesLoading ? (
                <p className="text-sm text-muted-foreground">Loading categories...</p>
              ) : categoriesError ? (
                <p className="text-sm text-destructive">Could not load categories.</p>
              ) : (
                <div className="divide-y divide-border">
                  {categories.map((category) => (
                    <div key={category.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div>
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.slug} · {category.is_active ? "Active" : "Inactive"}
                        </p>
                        {category.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditCategory(category)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleCategory(category)}>
                          {category.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteCategory(category.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No categories found.
                    </p>
                  )}
                </div>
              )}
              </div>
       )}
            </section>
                          <div className="mt-8 grid gap-3 md:grid-cols-3">
              <input
                type="search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search name, SKU or brand..."
                className="w-full border border-border bg-card px-4 py-3 text-sm"
              />

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full border border-border bg-card px-4 py-3 text-sm"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                className="w-full border border-border bg-card px-4 py-3 text-sm"
              >
                <option value="all">All stock statuses</option>
                <option value="in-stock">In stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
            </div>
       <div className="mt-8 overflow-hidden border border-border bg-card">
              <div className="hidden grid-cols-[80px_1fr_140px_100px_110px] gap-4 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid"><span>Photo</span><span>Product</span><span>Price</span><span>Stock</span><span>Actions</span></div>
              <div className="divide-y divide-border">{filteredProducts.map((product) => <div key={product.id} className="grid gap-4 p-5 md:grid-cols-[80px_1fr_140px_100px_110px] md:items-center">
                <img src={product.images[0]} alt="" className="h-20 w-20 bg-product-surface object-contain p-2" />
                <div><Link to="/product/$slug" params={{ slug: product.slug }} target="_blank" className="font-bold hover:text-accent">{product.name}</Link><p className="mt-1 text-xs text-muted-foreground">{product.sku} · {product.brand}{product.isDemo ? " · Sample" : ""}</p></div>
                <p className="font-semibold">{productPriceLabel(product)}</p><p className={product.priceOnRequest ? "text-muted-foreground" : product.stock > 0 ? "text-success" : "text-destructive"}>{product.priceOnRequest ? "Confirm stock" : `${product.stock} in stock`}</p>
                <div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Edit ${product.name}`} onClick={() => setEditor({ product })}><Edit /></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label={`Delete ${product.name}`} className="text-destructive"><Trash2 /></Button></AlertDialogTrigger><AlertDialogContent className="rounded-none"><AlertDialogHeader><AlertDialogTitle>Delete this product?</AlertDialogTitle><AlertDialogDescription>“{product.name}” will be removed from the storefront. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel><AlertDialogAction disabled={deleting} onClick={() => confirmDelete(product.id)} className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete product</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
              </div>)}</div>
              {filteredProducts.length === 0 && <p className="p-12 text-center text-muted-foreground">No products yet. Add your first product to show it on the storefront.</p>}
            </div>
          </>
        )}
      </main>
            <Dialog open={editor !== null} onOpenChange={(open) => { if (!open) setEditor(null); }}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editor?.product ? "Edit product" : "Add a new product"}
            </DialogTitle>
          </DialogHeader>
          {editor && (
            <ProductForm
              product={editor.product}
              onClose={() => setEditor(null)}
              categories={categories.filter((category) => category.is_active)}
            />
          )}
        </DialogContent>
      </Dialog>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="text-2xl">Import safety products</DialogTitle>
          </DialogHeader>
          {importOpen && (
            <CsvImport
              existing={products ?? []}
              categories={categories.filter((category) => category.is_active)}
            />
          )}
        </DialogContent>
      </Dialog>
          <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            setCategoryName("");
            setCategoryDescription("");
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={saveCategory} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Category Name
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Enter category name"
                minLength={2}
                maxLength={100}
                required
                className="w-full border border-border bg-background p-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>
              <textarea
                value={categoryDescription}
                onChange={(event) => setCategoryDescription(event.target.value)}
                placeholder="Enter category description"
                maxLength={500}
                rows={4}
                className="w-full border border-border bg-background p-3 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={categorySaving}>
                {categorySaving ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
