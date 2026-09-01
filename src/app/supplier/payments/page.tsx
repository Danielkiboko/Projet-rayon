import SupplierPaymentsClient from "./SupplierPaymentsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiements | Espace Fournisseur",
  description: "Gérez vos paiements reçus",
};

export default function SupplierPaymentsPage() {
  return <SupplierPaymentsClient />;
}
