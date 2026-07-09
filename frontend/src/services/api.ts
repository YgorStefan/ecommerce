// Instância configurada do Axios com interceptors para autenticação automática

import axios, { AxiosError } from 'axios';

// URL base da API — usa variável de ambiente ou fallback para localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Cria a instância principal do Axios com configurações padrão
export const api = axios.create({
  baseURL: `${API_URL}/api`, // Todas as requisições usam /api como prefixo
  withCredentials: true,     // Global flag for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição limpo: os cookies dão bypass manual the auth headers
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);


// Interceptor de resposta — trata erros e renova tokens expirados.
// O refresh token vive inteiramente em um cookie httpOnly; o backend extrai o
// ID do usuário do próprio token, então não há necessidade de enviar nada no corpo.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Nunca tenta renovar o token da própria rota de login/refresh (evita loop infinito)
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });

        // Cookies são atualizados automaticamente pelo backend — reenvia a requisição original
        return api(originalRequest);
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

// SERVIÇOS DA API

// Serviço de autenticação
export const authService = {
  // Realiza o cadastro de novo usuário
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),

  // Autentica o usuário com e-mail e senha
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  // Realiza o logout e invalida o refresh token
  logout: () => api.post('/auth/logout'),

  // Solicita o envio do e-mail de recuperação de senha
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  // Redefine a senha usando o token recebido por e-mail
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

// Serviço de usuários
export const usersService = {
  // Obtém o perfil do usuário autenticado
  getProfile: () => api.get('/users/me'),

  // Atualiza o perfil do usuário
  updateProfile: (data: any) => api.patch('/users/me', data),

  // Altera a senha do usuário
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/me/change-password', data),

  // [Admin] Lista todos os usuários
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/users', { params }),

  // [Admin] Atualiza um usuário
  adminUpdate: (id: string, data: any) => api.patch(`/users/${id}`, data),
};

// Serviço de produtos
export const productsService = {
  // Lista produtos com filtros e paginação
  getAll: (params?: any) => api.get('/products', { params }),

  // Busca um produto pelo slug
  getBySlug: (slug: string) => api.get(`/products/${slug}`),

  // [Admin] Cria um produto
  create: (data: any) => api.post('/products', data),

  // [Admin] Atualiza um produto
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),

  // [Admin] Remove um produto
  remove: (id: string) => api.delete(`/products/${id}`),

  // [Admin] Upload de imagens
  uploadImages: (id: string, formData: FormData) =>
    api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Serviço de categorias
export const categoriesService = {
  // Lista todas as categorias ativas
  getAll: () => api.get('/categories'),

  // Cria uma nova categoria (admin)
  create: (data: any) => api.post('/categories', data),

  // Atualiza uma categoria (admin)
  update: (id: string, data: any) => api.patch(`/categories/${id}`, data),

  // Remove uma categoria (admin)
  remove: (id: string) => api.delete(`/categories/${id}`),
};

// Serviço do carrinho
export const cartService = {
  // Obtém o carrinho atual
  getCart: () => api.get('/cart'),

  // Adiciona um item ao carrinho
  addItem: (productId: string, quantity: number) =>
    api.post('/cart/items', { productId, quantity }),

  // Atualiza a quantidade de um item
  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}`, { quantity }),

  // Remove um item do carrinho
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),

  // Esvazia o carrinho
  clearCart: () => api.delete('/cart'),
};

// Serviço de pedidos
export const ordersService = {
  // Cria um pedido (checkout)
  create: (data: any) => api.post('/orders', data),

  // Lista os pedidos do usuário autenticado
  getMyOrders: (page?: number) => api.get('/orders/me', { params: { page } }),

  // Detalhe de um pedido do usuário
  getMyOrder: (id: string) => api.get(`/orders/me/${id}`),

  // [Admin] Lista todos os pedidos
  getAll: (params?: any) => api.get('/orders', { params }),

  // [Admin] Atualiza o status de um pedido
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),

  // [Admin] Estatísticas de vendas (receita total, mensal e total de pedidos)
  getStats: () => api.get('/orders/stats'),
};

// Serviço de avaliações
export const reviewsService = {
  // Lista avaliações de um produto
  getByProduct: (productId: string, page?: number) =>
    api.get(`/reviews/product/${productId}`, { params: { page } }),

  // Cria uma avaliação
  create: (data: any) => api.post('/reviews', data),

  // Remove uma avaliação
  remove: (id: string) => api.delete(`/reviews/${id}`),
};

// Serviço da lista de desejos
export const wishlistService = {
  // Obtém a lista de desejos
  getAll: () => api.get('/wishlist'),

  // Adiciona um produto à wishlist
  addItem: (productId: string) => api.post('/wishlist', { productId }),

  // Remove um produto da wishlist
  removeItem: (productId: string) => api.delete(`/wishlist/${productId}`),

  // Verifica se produto está na wishlist
  check: (productId: string) => api.get(`/wishlist/check/${productId}`),
};

// Serviço de cupons
export const couponsService = {
  // Valida um cupom
  validate: (code: string, orderSubtotal: number) =>
    api.post('/coupons/validate', { code, orderSubtotal }),

  // [Admin] Lista todos os cupons
  getAll: () => api.get('/coupons'),

  // [Admin] Cria um cupom
  create: (data: any) => api.post('/coupons', data),

  // [Admin] Atualiza um cupom
  update: (id: string, data: any) => api.patch(`/coupons/${id}`, data),

  // [Admin] Remove um cupom
  remove: (id: string) => api.delete(`/coupons/${id}`),
};

// Serviço de frete
export const shippingService = {
  // Calcula preço e prazo PAC/SEDEX (usando a API Serverless gratuita do Next.js).
  // Caminho relativo à própria origem do frontend — não usa a instância `api` porque
  // esta rota é servida pelo próprio Next.js, não pelo backend NestJS.
  calculate: (zipCode: string) => axios.get('/api/shipping/calculate', { params: { zipCode } }),
};

