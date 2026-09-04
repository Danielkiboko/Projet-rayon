import SupplierLedgerClient from "./SupplierLedgerClient";

export const metadata = {
  title: "Livre de Caisse - Fournisseur | Rayons",
  description: "Journal des activités et livre de caisse",
};

export default function SupplierLedgerPage() {
  return <SupplierLedgerClient />;
}
