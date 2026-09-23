import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";

const capabilities = [
  { icon: BriefcaseBusiness, label: "المشاريع", value: "Delivery" },
  { icon: CircleDollarSign, label: "المالية", value: "Finance" },
  { icon: UsersRound, label: "الفريق", value: "People" },
  { icon: BarChart3, label: "القرارات", value: "Insights" }
];

export function PremiumLoginPage() {
  const navigate = useNavigate();
  const token = useAppStore((state) => state.accessToken);
  const setSession = useAppStore((state) => state.setSession);
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const isAr = locale === "ar";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: (payload) => {
      setSession(payload);
      navigate("/", { replace: true });
    }
  });

  if (token) return <Navigate to="/" replace />;

  return (
    <main className="premium-login min-h-screen overflow-hidden bg-[#070708] text-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="premium-login-grid" />
      <div className="premium-login-glow premium-login-glow-a" />
      <div className="premium-login-glow premium-login-glow-b" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden px-10 py-9 lg:flex xl:px-16 xl:py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="premium-brand-mark"><span>P</span></div>
              <div>
                <p className="text-[15px] font-semibold tracking-[-0.02em]">PROOTECH</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/35">Operating System</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/55 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" />
              Secure workspace
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative max-w-[760px] py-12"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7c38ff]/30 bg-[#6300ff]/10 px-3.5 py-2 text-xs font-medium text-[#cbb5ff]">
              <Sparkles size={14} />
              {isAr ? "مركز قيادة Prootech" : "Prootech command center"}
            </div>
            <h1 className="max-w-[760px] text-[3.4rem] font-semibold leading-[1.07] tracking-[-0.055em] xl:text-[4.65rem]">
              {isAr ? (
                <>كل الشركة، <span className="premium-text-gradient">بقرار واحد.</span></>
              ) : (
                <>The whole company, <span className="premium-text-gradient">one command away.</span></>
              )}
            </h1>
            <p className="mt-7 max-w-xl text-[15px] leading-8 text-white/48 xl:text-base">
              {isAr
                ? "إدارة المشاريع، التحصيل، الشركاء، الفريق، المبيعات والعمليات المالية من مساحة واحدة مصممة للإدارة اليومية والنمو."
                : "Projects, collections, partners, people, sales and finance in one workspace designed for daily execution and growth."}
            </p>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 xl:grid-cols-4">
              {capabilities.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + index * 0.06 }}
                    className="premium-capability"
                  >
                    <div className="mb-5 grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-[#a979ff]">
                      <Icon size={16} />
                    </div>
                    <p className="text-sm font-medium text-white/90">{isAr ? item.label : item.value}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/28">{item.value}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <div className="flex items-end justify-between gap-6">
            <div className="flex items-center gap-2 text-[11px] text-white/32">
              <ShieldCheck size={14} className="text-white/50" />
              Role based access · Audit trail · Secure sessions
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/20">Prootech Agency · 2026</p>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:border-s lg:border-white/[0.06] lg:bg-white/[0.018] lg:px-10 xl:px-16">
          <div className="absolute top-7 end-7 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(isAr ? "en" : "ar")}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/60 backdrop-blur-xl hover:bg-white/[0.08] hover:text-white"
            >
              {isAr ? "EN" : "AR"}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.985, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-[470px]"
          >
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="premium-brand-mark"><span>P</span></div>
              <div>
                <p className="text-sm font-semibold">PROOTECH</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">Operating System</p>
              </div>
            </div>

            <div className="premium-login-card">
              <div className="mb-8">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#7431ff]/30 bg-[#6300ff]/12 text-[#a979ff] shadow-[0_12px_40px_rgba(99,0,255,.18)]">
                  <LockKeyhole size={19} />
                </div>
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h2 className="text-[1.8rem] font-semibold tracking-[-0.035em] text-white">
                      {isAr ? "تسجيل الدخول" : "Welcome back"}
                    </h2>
                    <p className="mt-2 text-[13px] leading-6 text-white/42">
                      {isAr ? "ادخل إلى مساحة إدارة Prootech الخاصة بك." : "Sign in to your Prootech management workspace."}
                    </p>
                  </div>
                  <div className="mt-1 hidden items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-medium text-emerald-300/80 sm:flex">
                    <BadgeCheck size={12} /> Secure
                  </div>
                </div>
              </div>

              <form onSubmit={(event) => { event.preventDefault(); if (email && password) login.mutate(); }}>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-medium text-white/48">{isAr ? "البريد الإلكتروني" : "Email address"}</span>
                    <div className="premium-input-wrap">
                      <Mail size={16} className="text-white/28" />
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="name@prootech.agency"
                        className="premium-login-input"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-medium text-white/48">{isAr ? "كلمة المرور" : "Password"}</span>
                    <div className="premium-input-wrap">
                      <LockKeyhole size={16} className="text-white/28" />
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••••"
                        className="premium-login-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/28 hover:bg-white/[0.05] hover:text-white/70"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </label>
                </div>

                {login.error && (
                  <div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3 text-xs leading-5 text-red-200/90">
                    {isAr ? "تعذر تسجيل الدخول. تأكد من البريد وكلمة المرور وحاول مجدداً." : "Could not sign in. Check your credentials and try again."}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={login.isPending || !email || !password}
                  className="premium-login-submit mt-6"
                >
                  <span>{login.isPending ? (isAr ? "جاري الدخول..." : "Signing in...") : (isAr ? "دخول إلى النظام" : "Enter workspace")}</span>
                  <ArrowLeft size={16} className={isAr ? "" : "rotate-180"} />
                </button>
              </form>

              <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/[0.07] pt-5 text-[10px] text-white/28">
                <ShieldCheck size={12} />
                {isAr ? "جلسة مشفرة وصلاحيات حسب الحساب" : "Encrypted session with role-based permissions"}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
