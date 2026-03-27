// Interfaces TypeScript que espelham as entidades do backend

// Papel do usuário no sistema
export type UserRole = 'admin' | 'user';

// Dados do usuário autenticado
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: boolean;
  createdAt: string;
}

// Categoria de produto
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

// Imagem de produto
export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position: number;
}

// Produto da loja
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sku?: string;
  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  weight?: number;
  category?: Category;
  categoryId?: string;
  images: ProductImage[];
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

// Avaliação de produto
export interface Review {
  id: string;
  userId: string;
  productId: string;
  user: User;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

// Item do carrinho de compras
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

// Carrinho de compras
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

// Tipo do desconto do cupom
export type DiscountType = 'percentage' | 'fixed';

// Cupom de desconto
export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderValue?: number;
  maximumDiscount?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

// Status possíveis do pedido
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Métodos de pagamento disponíveis
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'boleto';

// Status do pagamento
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Endereço de entrega armazenado no pedido
export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

// Item de um pedido
export interface OrderItem {
  id: string;
  productId?: string;
  product?: Product;
  productName: string;
  productImage?: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

// Pedido completo
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: User;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  coupon?: Coupon;
  shippingAddress: ShippingAddress;
  notes?: string;
  createdAt: string;
}

// Item da lista de desejos
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

// Resposta paginada genérica do backend
export interface PaginatedResponse<T> {
  data: {
    total: number;
    page: number;
    lastPage: number;
  } & Record<string, T[] | number>;
}

// Parâmetros de busca de produtos
export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
}

// Resposta padrão da API
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
}

// Dados de autenticação retornados pelo backend
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
