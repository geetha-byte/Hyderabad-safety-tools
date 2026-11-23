ALTER TABLE public.products ADD COLUMN is_published boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.products.is_published IS 'Only published products may be read by storefront visitors; admins retain access to unpublished products.';
DROP POLICY "Anyone can view products" ON public.products;
CREATE POLICY "Visitors can view published products" ON public.products FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
DROP POLICY "Anyone can view product images" ON storage.objects;
CREATE POLICY "Admins can view private product images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'product-images' AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role));