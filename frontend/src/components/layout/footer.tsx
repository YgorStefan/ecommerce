import Link from 'next/link';
import { Package } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e descrição */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Package className="h-5 w-5" />
              <span>E-commerce</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Produtos de qualidade com entrega rápida e segura para todo o Brasil.
            </p>
          </div>

          {/* Links da loja */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Loja</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground transition-colors">Todos os Produtos</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-foreground transition-colors">Destaques</Link></li>
            </ul>
          </div>

          {/* Links da conta */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Minha Conta</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/account" className="hover:text-foreground transition-colors">Perfil</Link></li>
              <li><Link href="/account/orders" className="hover:text-foreground transition-colors">Pedidos</Link></li>
              <li><Link href="/account/wishlist" className="hover:text-foreground transition-colors">Lista de Desejos</Link></li>
            </ul>
          </div>

          {/* Informações de contato */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Contato</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>contato@ecommerce.com</li>
              <li>(11) 99999-9999</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Linha de copyright */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} E-commerce. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
