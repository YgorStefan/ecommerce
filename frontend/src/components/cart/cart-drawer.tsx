// cart-drawer.tsx
// Drawer lateral com os itens do carrinho de compras

'use client';

import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency } from '@/lib/utils';

export function CartDrawer() {
  // Obtém o estado e ações do carrinho do store global
  const { cart, isOpen, closeCart, updateItem, removeItem, isLoading } = useCartStore();

  // Não renderiza nada se o drawer estiver fechado
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay escurecido por trás do drawer — clique fecha o drawer */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={closeCart}
      />

      {/* Painel lateral do carrinho */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl z-50 flex flex-col">
        {/* Cabeçalho do drawer */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho
            {/* Exibe a quantidade de itens no título */}
            {cart?.itemCount ? (
              <span className="text-sm font-normal text-muted-foreground">
                ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'})
              </span>
            ) : null}
          </h2>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Lista de itens do carrinho com scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          {!cart || cart.items.length === 0 ? (
            // Estado vazio do carrinho
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <ShoppingCart className="h-16 w-16 opacity-30" />
              <p>Seu carrinho está vazio</p>
              <Button variant="outline" onClick={closeCart} asChild>
                <Link href="/products">Explorar produtos</Link>
              </Button>
            </div>
          ) : (
            // Lista de itens do carrinho
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  {/* Imagem do produto */}
                  <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {item.product.imageUrl ? (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      // Placeholder quando não há imagem
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  {/* Informações do item */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(Number(item.product.price))}
                    </p>

                    {/* Controles de quantidade */}
                    <div className="flex items-center gap-1 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        disabled={isLoading}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={isLoading || item.quantity >= item.product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Preço total do item e botão de remover */}
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-sm font-semibold">
                      {formatCurrency(Number(item.product.price) * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rodapé do drawer com subtotal e botão de checkout */}
        {cart && cart.items.length > 0 && (
          <div className="p-4 border-t space-y-4">
            {/* Subtotal do carrinho */}
            <div className="flex justify-between items-center">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold text-lg">{formatCurrency(cart.subtotal)}</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Frete e cupons são aplicados no checkout
            </p>

            {/* Botão para ir ao checkout */}
            <Button className="w-full" size="lg" asChild onClick={closeCart}>
              <Link href="/checkout">Finalizar Compra</Link>
            </Button>

            {/* Link para continuar comprando */}
            <Button variant="outline" className="w-full" onClick={closeCart} asChild>
              <Link href="/products">Continuar Comprando</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
