export default function ConsumptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen overflow-hidden">
      {children}
    </div>
  );
}