// Página para solicitar a recuperação de senha por e-mail

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/services/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authService.forgotPassword(data.email);
    } catch {
      // Ignora erros silenciosamente — a resposta é sempre genérica por segurança
    } finally {
      // Sempre mostra a mesma mensagem de sucesso, exista ou não o e-mail cadastrado
      setSent(true);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl">Recuperar senha</CardTitle>
        <CardDescription>
          {sent
            ? 'Verifique sua caixa de entrada'
            : 'Informe seu e-mail para receber um link de recuperação'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {sent ? (
          <p className="text-sm text-muted-foreground text-center">
            Se o e-mail informado estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        <Link href="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o login
        </Link>
      </CardFooter>
    </Card>
  );
}
