// Página de perfil do usuário com edição de dados

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { usersService } from '@/services/api';
import { toast } from 'sonner';

// Schema de validação para edição do perfil
const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Schema para alteração de senha
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual'),
    newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmNewPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function AccountPage() {
  const { user, setUser } = useAuthStore();

  // Formulário de edição de perfil
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode || '',
    },
  });

  // Formulário de alteração de senha
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Salva as alterações do perfil
  const onSaveProfile = async (data: ProfileFormData) => {
    try {
      const response = await usersService.updateProfile(data);
      setUser(response.data.data); // Atualiza o usuário no store global
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar o perfil');
    }
  };

  // Altera a senha do usuário
  const onChangePassword = async (data: PasswordFormData) => {
    try {
      await usersService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Senha alterada com sucesso!');
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar a senha');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      {/* Card de edição de dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-name">Nome Completo</Label>
                <Input id="profile-name" {...profileForm.register('name')} />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              {/* E-mail — apenas exibição */}
              <div className="space-y-2">
                <Label htmlFor="profile-email">E-mail</Label>
                <Input id="profile-email" value={user?.email} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Telefone</Label>
                <Input id="profile-phone" placeholder="(11) 99999-9999" {...profileForm.register('phone')} />
              </div>

              {/* Endereço */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-address">Endereço</Label>
                <Input id="profile-address" placeholder="Rua, número, complemento" {...profileForm.register('address')} />
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <Label htmlFor="profile-city">Cidade</Label>
                <Input id="profile-city" {...profileForm.register('city')} />
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="profile-state">Estado</Label>
                <Input id="profile-state" placeholder="SP" maxLength={2} {...profileForm.register('state')} />
              </div>

              {/* CEP */}
              <div className="space-y-2">
                <Label htmlFor="profile-zipCode">CEP</Label>
                <Input id="profile-zipCode" placeholder="00000-000" {...profileForm.register('zipCode')} />
              </div>
            </div>

            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Card de alteração de senha */}
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input id="current-password" type="password" autoComplete="current-password" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" autoComplete="new-password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
              <Input id="confirm-new-password" type="password" autoComplete="new-password" {...passwordForm.register('confirmNewPassword')} />
              {passwordForm.formState.errors.confirmNewPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmNewPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
