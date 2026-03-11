// (auth)/layout.tsx
// Layout das páginas de autenticação — centralizado sem header/footer

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Container centralizado verticalmente com fundo sutil
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      {children}
    </div>
  );
}
