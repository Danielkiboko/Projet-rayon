import InvoiceManagerWrapper from "@/components/invoices/InvoiceManagerWrapper";

export const metadata = {
  title: "Proformas & Factures | Fournisseur",
};

export default function SupplierInvoicesPage() {
  return (
    <div className="p-4 sm:p-8">
      <InvoiceManagerWrapper />
    </div>
  );
}
