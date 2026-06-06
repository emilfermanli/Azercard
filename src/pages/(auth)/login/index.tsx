import type { AppDispatch } from '@/store/index';

import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import { Button, Input, LoadingSpinner } from '@/components';

import { login } from '@/store/features/auth.slice';
import { useLoginMutation } from '@/services/auth.service';
import { useState } from 'react';

type LoginForm = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const featureItems = [
  {
    icon: ShieldCheck,
    title: 'Təhlükəsiz giriş',
    description: 'Sessiyalar və istifadəçi rolları qorunan mühitdə idarə olunur.',
  },
  {
    icon: BarChart3,
    title: 'Analitika paneli',
    description: 'Hesabat, xəritə və bazar göstəricilərinə bir mərkəzdən keçid.',
  },
  {
    icon: UsersRound,
    title: 'Komanda idarəetməsi',
    description: 'Departament, rol və istifadəçi əməliyyatları üçün vahid iş axını.',
  },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [loginRequest, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState<boolean>(false);

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
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#f4f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white to-transparent" />

      <main className="relative z-10 mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl items-center gap-8 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:py-12">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <BadgeCheck className="h-4 w-4" />
              Korporativ idarəetmə mühiti
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-950 text-lg font-bold tracking-tight text-white shadow-lg shadow-slate-950/15">
                  PM
                </div>
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                    İdarəetmə Paneli
                  </h1>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    İdarəetmə Sistemi
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
                Daxili əməliyyatlar, istifadəçi rolları və analitika modulları üçün
                sürətli, fokuslanmış və təhlükəsiz giriş nöqtəsi.
              </p>
            </div>

            <div className="mt-10 grid gap-3">
              {featureItems.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="grid grid-cols-[2.75rem_1fr] gap-3 rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      {title}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-slate-500">
                      {description}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-[456px] rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-2xl shadow-slate-200/80 sm:px-8 sm:py-8">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-950 text-base font-bold tracking-tight text-white">
                  PM
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">İdarəetmə Paneli</p>
                  <p className="text-sm text-slate-500">İdarəetmə Sistemi</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-700">Xoş gəlmisiniz</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Hesabınıza daxil olun
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Panelə keçmək üçün korporativ giriş məlumatlarınızı yazın.
              </p>

              <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="login-email"
                    className="text-sm font-medium text-slate-700"
                  >
                    E-poçt
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="email@numune.az"
                      className="h-12 border-slate-200 bg-slate-50 pl-10 text-slate-950 shadow-none focus-visible:bg-white focus-visible:ring-blue-600"
                      {...register('email', { required: true })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Şifrə
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Şifrənizi daxil edin"
                      className="h-12 border-slate-200 bg-slate-50 pl-10 pr-12 text-slate-950 shadow-none focus-visible:bg-white focus-visible:ring-blue-600"
                      {...register('password', { required: true })}
                    />
                    <button
                      aria-label={showPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      onClick={() => setShowPassword((value: boolean) => !value)}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="h-12 w-full gap-2 border-0 bg-slate-950 text-base font-semibold text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" className="text-white" />
                  ) : (
                    <>
                      Daxil ol
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-7 flex items-center gap-3 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                Giriş məlumatlarınız şifrələnmiş kanal üzərindən yoxlanılır.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
