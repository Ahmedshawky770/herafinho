"use client";

import Link from "next/link";

const CRAFT_TYPES = [
  { label: "نجار", icon: "🪚" },
  { label: "سباك", icon: "🔧" },
  { label: "دهان", icon: "🖌️" },
  { label: "كهربائي", icon: "⚡" },
  { label: "لحام", icon: "🔥" },
  { label: "بلاط", icon: "🧱" },
  { label: "سيراميك", icon: "🟦" },
  { label: "مشغولات ألومنيوم", icon: "🪟" },
  { label: "تكييف وتبريد", icon: "❄️" },
  { label: "تركيب أطباق", icon: "📡" },
  { label: "دهانات بيضاء", icon: "🏠" },
  { label: "نجار ألومنيوم", icon: "🚪" },
];

const FEATURES = [
  {
    title: "حرفيون موثّقون",
    description:
      "كل حرفي يمر بمراجعة إدارية (بطاقة هوية، صورة، وسيلة نقل، عنوان ورشة) قبل ظهوره للعملاء.",
    icon: "✅",
  },
  {
    title: "تتبّع موقع لحظي",
    description: "تعرّف على الحرفيين المتاحين بالقرب منك على الخريطة في الوقت الفعلي.",
    icon: "📍",
  },
  {
    title: "تقييمات ومراجعات",
    description: "تأكد من جودة العمل من خلال تقييمات العملاء السابقين.",
    icon: "⭐",
  },
  {
    title: "شكاوى بآلية عادلة",
    description: "نظام شكاوى مع سياسة إنذارات (3 إنذارات = حظر تلقائي) للحفاظ على الثقة.",
    icon: "🛡️",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
      {/* Hero */}
      <header className="bg-gradient-to-b from-blue-600 to-blue-700 text-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-xl font-bold">حرفينو</span>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/search" className="hover:underline">
              ابحث عن حرفي
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-white px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-50"
            >
              تسجيل الدخول
            </Link>
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">حرفينو — Harfino</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-blue-50">
            منصة مصرية تربط الحرفيين الموثوقين بالعملاء. اعثر على نجار أو سباك أو كهربائي قريب منك،
            تابع موقعه لحظياً، وقيّم خدمته بكل ثقة.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              ابدأ الآن
            </Link>
            <Link
              href="/search"
              className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              تصفّح الحرفيين
            </Link>
          </div>
        </div>
      </header>

      {/* Craft taxonomy */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">مهن متاحة</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CRAFT_TYPES.map((craft) => (
            <Link
              key={craft.label}
              href={`/search?craftType=${encodeURIComponent(craft.label)}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 transition hover:border-blue-400 hover:shadow-sm"
            >
              <span className="text-2xl" aria-hidden>
                {craft.icon}
              </span>
              <span className="font-medium">{craft.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold">لماذا حرفينو؟</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-gray-100 bg-gray-50 p-6">
                <div className="mb-3 text-3xl" aria-hidden>
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">أنت حرفي؟ انضم إلينا</h2>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          سجّل حسابك، أكمل ملفك، وابدأ في استقبال الطلبات من العملاء في منطقتك.
        </p>
        <Link
          href="/choose-account"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          سجّل كحرفي
        </Link>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} حرفينو — منصة الحرفيين في مصر.
      </footer>
    </div>
  );
}
