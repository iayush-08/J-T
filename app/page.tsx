import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Jal-Tarang — A public ledger of plastic in India's fishing waters",
  description: "Field data from ICAR-CMFRI, NIO and MPEDA on how marine plastic reaches India's fishing grounds.",
};

export default function Page() {
  return (
    <main className="w-full h-screen overflow-hidden bg-[#0E1213]">
      <iframe
        src="/index.html"
        className="w-full h-full border-0"
        title="Jal-Tarang — Marine Plastic Ledger"
      />
    </main>
  );
}
