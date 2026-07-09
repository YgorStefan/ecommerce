// Store Zustand para gerenciamento global do estado de autenticação

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authService } from '@/services/api';
import { useCartStore } from './cart.store';

// Interface que define o estado e as ações do store de autenticação
interface AuthState {
  user: User | null;         // Usuário autenticado ou null se não logado
  isAuthenticated: boolean;  // Flag que indica se o usuário está logado
  isLoading: boolean;        // Indica se há uma operação em andamento
  // Indica se o middleware `persist` já terminou de ler o localStorage. Antes
  // disso, `isAuthenticated` sempre começa como `false` — guardas de rota que
  // não esperarem esse flag podem redirecionar incorretamente um usuário já
  // autenticado logo após um refresh de página (condição de corrida)
  hasHydrated: boolean;

  // Ações disponíveis no store
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

// Cria o store com persistência no localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      // Realiza o login — os tokens vivem inteiramente em cookies httpOnly
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });
          const { user } = response.data.data ? response.data.data : response.data;

          set({ user, isAuthenticated: true, isLoading: false });
          // Carrega o carrinho do usuário assim que a sessão é estabelecida
          useCartStore.getState().fetchCart();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Realiza o cadastro e já autentica o usuário
      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          const { user } = response.data.data ? response.data.data : response.data;

          set({ user, isAuthenticated: true, isLoading: false });
          useCartStore.getState().fetchCart();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Realiza o logout e limpa todos os dados de sessão
      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Ignora erros de rede no logout para garantir que a sessão seja limpa
        }

        set({ user: null, isAuthenticated: false });
      },

      // Atualiza os dados do usuário no estado (após edição de perfil)
      setUser: (user) => set({ user }),

      // Limpa completamente o estado de autenticação
      clearAuth: () => {
        set({ user: null, isAuthenticated: false });
      },

      // Marca que a hidratação do localStorage terminou
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'auth-storage', // Chave no localStorage para persistência
      // Persiste apenas os dados do usuário, não o estado de loading
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Chamado quando o middleware termina de reidratar o estado a partir do
      // localStorage — a partir daqui os guardas de rota podem confiar no valor
      // de `isAuthenticated`
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
