// auth.store.ts
// Store Zustand para gerenciamento global do estado de autenticação

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authService } from '@/services/api';

// Interface que define o estado e as ações do store de autenticação
interface AuthState {
  user: User | null;         // Usuário autenticado ou null se não logado
  isAuthenticated: boolean;  // Flag que indica se o usuário está logado
  isLoading: boolean;        // Indica se há uma operação em andamento

  // Ações disponíveis no store
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

// Cria o store com persistência no localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Realiza o login e persiste os tokens
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });
          const { user } = response.data.data ? response.data.data : response.data;

          // Apenas mantemos referência do ID. Tokens vão pros cookies!
          localStorage.setItem('userId', user.id);

          set({ user, isAuthenticated: true, isLoading: false });
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

          localStorage.setItem('userId', user.id);

          set({ user, isAuthenticated: true, isLoading: false });
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

        localStorage.removeItem('userId');

        set({ user: null, isAuthenticated: false });
      },

      // Atualiza os dados do usuário no estado (após edição de perfil)
      setUser: (user) => set({ user }),

      // Limpa completamente o estado de autenticação
      clearAuth: () => {
        localStorage.removeItem('userId');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage', // Chave no localStorage para persistência
      // Persiste apenas os dados do usuário, não o estado de loading
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
