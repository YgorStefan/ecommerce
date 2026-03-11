// admin/users/page.tsx
// Painel admin — gestão de usuários

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usersService } from '@/services/api';
import { User } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Busca todos os usuários paginados
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => usersService.getAll({ page, limit: 20 }),
    select: (res) => res.data.data,
  });

  const users: User[] = data?.users || [];
  const totalPages: number = data?.lastPage || 1;

  // Mutation para atualizar dados de um usuário (papel, status)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersService.adminUpdate(id, data),
    onSuccess: () => {
      toast.success('Usuário atualizado!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    },
  });

  // Alterna entre admin e user
  const toggleRole = (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Alterar papel de "${user.name}" para ${newRole}?`)) {
      updateMutation.mutate({ id: user.id, data: { role: newRole } });
    }
  };

  // Ativa ou desativa a conta do usuário
  const toggleActive = (user: User) => {
    const action = user.isActive ? 'desativar' : 'ativar';
    if (window.confirm(`Deseja ${action} a conta de "${user.name}"?`)) {
      updateMutation.mutate({ id: user.id, data: { isActive: !user.isActive } });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">Gerencie os usuários cadastrados</p>
      </div>

      <Card>
        <CardContent className="pt-6">
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
                    <th className="text-left p-3 font-medium text-muted-foreground">E-mail</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Papel</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Cadastro</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-medium">{user.name}</td>
                      <td className="p-3 text-muted-foreground">{user.email}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Cliente'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão para alternar papel */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRole(user)}
                            disabled={updateMutation.isPending}
                          >
                            {user.role === 'admin' ? 'Tornar Cliente' : 'Tornar Admin'}
                          </Button>
                          {/* Botão para ativar/desativar */}
                          <Button
                            variant={user.isActive ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => toggleActive(user)}
                            disabled={updateMutation.isPending}
                          >
                            {user.isActive ? 'Desativar' : 'Ativar'}
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
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
