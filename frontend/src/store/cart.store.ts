// Store Zustand para gerenciamento global do carrinho de compras

import { create } from 'zustand';
import { Cart } from '@/types';
import { cartService } from '@/services/api';

// Interface do estado e ações do store do carrinho
interface CartState {
  cart: Cart | null;        // Dados do carrinho ou null se vazio
  isOpen: boolean;          // Controla se o drawer do carrinho está aberto
  isLoading: boolean;       // Indica operação em andamento

  // Ações disponíveis
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isOpen: false,
  isLoading: false,

  // Busca o carrinho do servidor e atualiza o estado
  fetchCart: async () => {
    try {
      const response = await cartService.getCart();
      set({ cart: response.data.data });
    } catch {
      // Silencia o erro se o usuário não está logado
    }
  },

  // Adiciona um item ao carrinho e abre o drawer automaticamente
  addItem: async (productId, quantity = 1) => {
    set({ isLoading: true });
    try {
      const response = await cartService.addItem(productId, quantity);
      set({ cart: response.data.data, isLoading: false, isOpen: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Atualiza a quantidade de um item (0 = remover)
  updateItem: async (itemId, quantity) => {
    set({ isLoading: true });
    try {
      if (quantity <= 0) {
        // Se quantidade zero, delega para removeItem
        await get().removeItem(itemId);
      } else {
        const response = await cartService.updateItem(itemId, quantity);
        set({ cart: response.data.data, isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Remove um item do carrinho
  removeItem: async (itemId) => {
    set({ isLoading: true });
    try {
      const response = await cartService.removeItem(itemId);
      set({ cart: response.data.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Esvazia o carrinho completamente
  clearCart: async () => {
    try {
      await cartService.clearCart();
      set({ cart: null });
    } catch {
      set({ cart: null });
    }
  },

  // Alterna a visibilidade do drawer do carrinho
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  // Abre o drawer do carrinho
  openCart: () => set({ isOpen: true }),

  // Fecha o drawer do carrinho
  closeCart: () => set({ isOpen: false }),
}));
