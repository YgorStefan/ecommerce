// Funções utilitárias usadas em toda a aplicação

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combina classes CSS condicionalmente e resolve conflitos do Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formata um valor numérico como moeda brasileira  
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Formata uma data para o padrão brasileiro
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

// Formata data com hora para exibição de timestamps
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Trunca um texto longo e adiciona ...
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Mapeia o status do pedido para um texto e cor em português
export function getOrderStatusInfo(status: string) {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    processing: { label: 'Em Processamento', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  };

  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
}
