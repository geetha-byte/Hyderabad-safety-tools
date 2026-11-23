import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { categories } from "@/lib/catalog";
import { WHATSAPP } from "@/lib/store";
import { Logo } from "./Header";

export function Footer() {
  return (
    <footer className="bg-navy-deep text-navy-deep-foreground">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-4">
          <div className="[&_span]:text-navy-deep-foreground [&_.text-accent]:text-accent"><Logo /></div>
          <p className="text-sm opacity-70">Industrial safety equipment, PPE, fire safety and workplace protection — delivered across India.</p>
        </div>
        <div><h3 className="mb-4 font-bold">Categories</h3><ul className="space-y-2 text-sm opacity-80">{categories.slice(0, 6).map((c) => <li key={c.slug}><Link to="/shop" search={{ cat: c.slug }} className="hover:text-accent">{c.name}</Link></li>)}</ul></div>
        <div><h3 className="mb-4 font-bold">Customer Support</h3><ul className="space-y-2 text-sm opacity-80">
          <li><Link to="/policies" search={{ p: "shipping" }} className="hover:text-accent">Shipping & Returns</Link></li>
          <li><Link to="/policies" search={{ p: "privacy" }} className="hover:text-accent">Privacy Policy</Link></li>
          <li><Link to="/policies" search={{ p: "terms" }} className="hover:text-accent">Terms & Conditions</Link></li>
          <li><Link to="/quote" className="hover:text-accent">Bulk Quote</Link></li></ul></div>
        <div><h3 className="mb-4 font-bold">Contact</h3><ul className="space-y-3 text-sm opacity-80">
          <li className="flex gap-2"><Phone className="h-4 w-4" /> +91 00000 00000</li>
          <li className="flex gap-2"><Mail className="h-4 w-4" /> <a href="mailto:sales@example.com">sales@example.com</a></li>
          <li><a href={WHATSAPP} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-accent"><MessageCircle className="h-4 w-4" /> Chat on WhatsApp</a></li></ul></div>
      </div>
      <div className="border-t border-navy-deep-foreground/15 px-4 py-5 text-center text-xs opacity-60">© {new Date().getFullYear()} HyderabadSafetyTools.com · Product listings shown are demo content.</div>
    </footer>
  );
}

export function WhatsAppFab() {
  return <a href={WHATSAPP} target="_blank" rel="noreferrer" aria-label="WhatsApp us" className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-success text-primary-foreground shadow-lift transition hover:scale-110"><MessageCircle className="h-7 w-7" /></a>;
}
