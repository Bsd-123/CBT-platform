export default function MaterialsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="materials-space">{children}</div>;
}
