import type { AppDispatch } from '@/store/index';

import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

import { Button, Input, LoadingSpinner } from '@/components';
import { useToast } from '@/hooks/useToast';

import { login } from '@/store/features/auth.slice';
import { useLoginMutation } from '@/services/auth.service';

type LoginForm = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const featureItems = [
  'Təhlükəsiz giriş',
  'Maliyyə hesabat alətləri',
  'İnventar idarəetmə sistemi',
];

const LoginPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [loginRequest, { isLoading }] = useLoginMutation();

  const { register, handleSubmit } = useForm<LoginForm>({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const auth = await loginRequest({
        email: values.email.trim(),
        password: values.password,
      }).unwrap();

      dispatch(login(auth));
      navigate('/istifadeciler');
    } catch {
      return;
    }
  });

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 px-4 py-10 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.25),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.2),_transparent_50%)]" />

      <button
        type="button"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white shadow-lg backdrop-blur-md transition hover:bg-white/10 sm:right-6 sm:top-6"
        aria-label="Dil: Azərbaycan"
      >
        🇦🇿
      </button>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] max-w-5xl items-center justify-center sm:min-h-[calc(100dvh-6rem)]">
        <div className="grid w-full max-w-[960px] overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40 lg:grid-cols-2">
          <aside className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-center">
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />

            <div className="relative flex flex-col items-center text-center">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-white/15 text-2xl font-bold tracking-tight shadow-inner backdrop-blur-sm">
                PM
              </div>
              <h1 className="text-3xl font-bold leading-tight">İdarəetmə Paneli</h1>
              <p className="mt-2 text-sm text-white/85">İdarəetmə Sistemi</p>

              <div className="mt-10 w-full max-w-sm rounded-xl border border-white/15 bg-black/15 p-5 text-left shadow-lg backdrop-blur-md">
                <ul className="flex flex-col gap-3 text-sm text-white/95">
                  {featureItems.map((text) => (
                    <li key={text} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-200">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          <div className="flex flex-col justify-center bg-slate-50 px-6 py-10 sm:px-10 sm:py-12">
            <div className="mx-auto w-full max-w-md">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
                Hesabınıza daxil olun
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Davam etmək üçün məlumatlarınızı daxil edin.
              </p>

              <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="login-email" className="text-sm font-medium text-slate-700">
                    E-poçt
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="email@nümunə.az"
                    className="h-11 border-slate-200 bg-white"
                    {...register('email', { required: true })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="login-password" className="text-sm font-medium text-slate-700">
                    Şifrə
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Şifrə"
                    className="h-11 border-slate-200 bg-white"
                    {...register('password', { required: true })}
                  />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      {...register('rememberMe')}
                    />
                    Məni xatırla
                  </label>
                  <button
                    type="button"
                    className="text-left text-sm font-medium text-indigo-600 underline-offset-2 hover:text-indigo-500 hover:underline sm:text-right"
                    onClick={() =>
                      toast({
                        title: 'Şifrə bərpası',
                        description: 'Bu funksiya tezliklə əlçatan olacaq.',
                      })
                    }
                  >
                    Şifrəni unutmusunuz?
                  </button>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="h-11 w-full border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold text-white shadow-md shadow-indigo-900/25 hover:from-blue-500 hover:to-indigo-500"
                >
                  {isLoading ? <LoadingSpinner size="sm" className="text-white" /> : 'Daxil ol'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 px-2 lg:hidden">
        <div className="mx-auto max-w-[960px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold">
              PM
            </div>
            <div>
              <p className="text-sm font-semibold">İdarəetmə Paneli</p>
              <p className="text-xs text-white/75">İdarəetmə Sistemi</p>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/90">
            {featureItems.map((text) => (
              <li key={text} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-300" strokeWidth={3} />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
