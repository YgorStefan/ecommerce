// Painel admin — gestão completa de produtos com CRUD

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productsService, categoriesService } from '@/services/api';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Estado do formulário de produto
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    sku: '',
    categoryId: '',
    isFeatured: false,
  });

  // Busca os produtos para a listagem
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => productsService.getAll({ page, limit: 20, search }),
    select: (res) => res.data.data,
  });

  // Busca as categorias para o select do formulário
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
    select: (res) => res.data.data as Category[],
  });

  const products: Product[] = data?.products || [];
  const totalPages: number = data?.lastPage || 1;

  // Mutation para criar produto
  const createMutation = useMutation({
    mutationFn: (data: any) => productsService.create(data),
    onSuccess: async (res) => {
      const productId = res.data?.data?.id || res.data?.id;
      if (imageFile && productId) {
        try {
          const formData = new FormData();
          formData.append('images', imageFile);
          await productsService.uploadImages(productId, formData);
        } catch (e) {
          toast.error('Produto criado, mas erro ao salvar imagem.');
        }
      }
      toast.success('Produto criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar produto');
    },
  });

  // Mutation para atualizar produto
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productsService.update(id, data),
    onSuccess: async (_, variables) => {
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append('images', imageFile);
          await productsService.uploadImages(variables.id, formData);
        } catch (e) {
          toast.error('Produto atualizado, mas erro ao salvar imagem.');
        }
      }
      toast.success('Produto atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar produto');
    },
  });

  // Mutation para remover produto
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    onSuccess: () => {
      toast.success('Produto removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => {
      toast.error('Erro ao remover produto');
    },
  });

  // Abre o formulário para criar um novo produto
  const openCreateForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      stock: '0',
      sku: '',
      categoryId: '',
      isFeatured: false,
    });
    setIsFormOpen(true);
  };

  // Abre o formulário preenchido para editar um produto
  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      stock: String(product.stock),
      sku: product.sku || '',
      categoryId: product.categoryId || '',
      isFeatured: product.isFeatured,
    });
    setIsFormOpen(true);
  };

  // Fecha o formulário e reseta o estado
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setImageFile(null);
  };

  // Envia o formulário (criar ou atualizar)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      stock: Number(formData.stock),
      sku: formData.sku || undefined,
      categoryId: formData.categoryId || undefined,
      isFeatured: formData.isFeatured,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Confirma e executa a exclusão do produto
  const handleDelete = (product: Product) => {
    if (window.confirm(`Tem certeza que deseja remover "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const isFormSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Cabeçalho com título e botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catálogo de produtos</p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/*  FORMULÁRIO DE PRODUTO  */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome do produto */}
              <div className="space-y-2 md:col-span-2">
                <Label>Nome *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição *</Label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
                />
              </div>

              {/* Preço de venda */}
              <div className="space-y-2">
                <Label>Preço de Venda (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              {/* Preço original (para desconto) */}
              <div className="space-y-2">
                <Label>Preço Original (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                />
              </div>

              {/* Estoque */}
              <div className="space-y-2">
                <Label>Estoque *</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Upload de Imagem */}
              <div className="space-y-2 md:col-span-2">
                <Label>Imagem do Produto</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="cursor-pointer file:cursor-pointer file:bg-muted file:border-0 file:rounded-md file:px-4 file:mr-4 file:h-full hover:file:bg-accent"
                />
                {imageFile && (
                  <p className="text-xs text-muted-foreground mt-1">Imagem selecionada: {imageFile.name}</p>
                )}
              </div>

              {/* Produto em destaque */}
              <div className="space-y-2">
                <Label>Destaque</Label>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span className="text-sm">Exibir na página inicial</span>
                </label>
              </div>

              {/* Botões do formulário */}
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={isFormSubmitting}>
                  {isFormSubmitting ? 'Salvando...' : editingProduct ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/*  TABELA DE PRODUTOS  */}
      <Card>
        <CardContent className="pt-6">
          {/* Barra de busca */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Tabela */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Categoria</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Preço</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Estoque</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {product.category?.name || '—'}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(Number(product.price))}
                      </td>
                      <td className="p-3 text-right">
                        {/* Destaca o estoque baixo em vermelho */}
                        <span className={product.stock <= 5 ? 'text-red-600 font-medium' : ''}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {product.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditForm(product)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
