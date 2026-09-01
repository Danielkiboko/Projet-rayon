"use client";

import dynamic from 'next/dynamic';

const SupplierInvoicesClient = dynamic(() => import('./SupplierInvoicesClient'), {
  ssr: false,
});

export default function Page() {
  return <SupplierInvoicesClient />;
}
