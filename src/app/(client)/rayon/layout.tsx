import { Footer } from "@/modules/shared/components/Footer";

export default function RayonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
