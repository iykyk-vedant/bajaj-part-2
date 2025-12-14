export default function ConsumptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen overflow-auto">
      {children}
    </div>
  );
}