import { Metadata } from 'next';
import { auth } from '@/app/auth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, CarFront, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface CraftsmanProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CraftsmanProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/craftsmen/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'حرفي غير موجود | حرفينو' };
    const { data } = await res.json();
    const craftLabel = data.craftType === 'carpenter' ? 'نجار' :
      data.craftType === 'plumber' ? 'سباك' :
      data.craftType === 'painter' ? 'دهان' :
      data.craftType === 'electrician' ? 'كهربائي' :
      data.craftType === 'welder' ? 'لحام' :
      data.craftType === 'tiler' ? 'بلاط' :
      data.craftType === 'ceramicist' ? 'سيراميك' :
      data.craftType === 'whitewasher' ? 'محارة' :
      data.craftType === 'hvac' ? 'تكييف' :
      data.craftType === 'satellite' ? 'أقمار' :
      data.craftType === 'aluminum' ? 'ألمونيوم' : data.craftType;
    return {
      title: `${craftLabel} - ${data.name} | حرفينو`,
      description: `ملف الحرفي ${data.name} - ${craftLabel} على منصة حرفينو`,
    };
  } catch {
    return { title: 'حرفي | حرفينو' };
  }
}

const TRANSPORT_LABELS: Record<string, string> = {
  bike: 'دراجة',
  walking: 'مشياً',
  car: 'سيارة',
  minivan: 'ميني فان',
};

const CRAFT_LABELS: Record<string, string> = {
  carpenter: 'نجار',
  plumber: 'سباك',
  painter: 'دهان',
  electrician: 'كهربائي',
  welder: 'لحام',
  tiler: 'بلاط',
  ceramicist: 'سيراميك',
  whitewasher: 'محارة',
  hvac: 'تكييف',
  satellite: 'أقمار',
  aluminum: 'ألمونيوم',
};

export default async function CraftsmanProfilePage({ params }: CraftsmanProfilePageProps) {
  const { id } = await params;

  const session = await auth();
  const isLoggedIn = !!session?.user;

  let profile: Record<string, unknown> | null = null;
  let avgRating: number | null = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const profileRes = await fetch(`${baseUrl}/api/craftsmen/${id}`, { next: { revalidate: 60 } });
    if (profileRes.ok) {
      const { data } = await profileRes.json();
      profile = data;
    }
  } catch {
    profile = null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const reviewsRes = await fetch(`${baseUrl}/api/reviews?craftsmanId=${id}`, { next: { revalidate: 60 } });
    if (reviewsRes.ok) {
      const { data } = await reviewsRes.json();
      if (Array.isArray(data) && data.length > 0) {
        avgRating = data.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / data.length;
      }
    }
  } catch {
    avgRating = null;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6" dir="rtl">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">حرفي غير موجود</h1>
          <p className="mt-2 text-sm text-gray-600">لم يتم العثور على الحرفي المطلوب</p>
          <Link href="/">
            <Button variant="outline" className="mt-4">العودة للصفحة الرئيسية</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const craftType = profile.craftType as string;
  const transportType = profile.transportType as string;
  const workshopAddress = profile.workshopAddress as string;
  const workshopLat = profile.workshopLatitude as string;
  const workshopLng = profile.workshopLongitude as string;
  const experienceYears = profile.experienceYears as number;
  const isAvailable = profile.isAvailable as boolean;
  const isOnline = profile.isOnline as boolean;

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden">
          <div className="bg-primary/5 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name as string}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="text-base text-primary font-medium">
                    {CRAFT_LABELS[craftType] ?? craftType}
                  </span>
                  {avgRating !== null && (
                    <span className="flex items-center gap-1 text-sm text-yellow-600">
                      <Star className="size-4 fill-yellow-500 text-yellow-500" />
                      {avgRating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={isAvailable ? 'default' : 'outline'} className="flex items-center gap-1">
                  {isAvailable ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                  {isAvailable ? 'متاح' : 'غير متاح'}
                </Badge>
                <Badge variant={isOnline ? 'default' : 'secondary'} className="flex items-center gap-1">
                  {isOnline ? 'متصل' : 'غير متصل'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Star className="mt-0.5 size-5 shrink-0 text-primary-500/70" />
                <div>
                  <p className="text-sm font-medium text-gray-700">الخبرة</p>
                  <p className="text-sm text-gray-600">{experienceYears} سنة خبرة</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CarFront className="mt-0.5 size-5 shrink-0 text-primary-500/70" />
                <div>
                  <p className="text-sm font-medium text-gray-700">وسيلة النقل</p>
                  <p className="text-sm text-gray-600">{TRANSPORT_LABELS[transportType] ?? transportType}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary-500/70" />
                <div>
                  <p className="text-sm font-medium text-gray-700">عنوان الورشة</p>
                  <p className="text-sm text-gray-600">{workshopAddress}</p>
                  <p className="mt-1 text-xs text-gray-400" dir="ltr">
                    {workshopLat}, {workshopLng}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4">
            {isLoggedIn ? (
              <Link href={`/orders/new?craftsmanId=${id}`}>
                <Button size="lg" className="w-full md:w-auto">
                  إنشاء طلب خدمة
                </Button>
              </Link>
            ) : (
              <Link href={`/login?redirect=/orders/new?craftsmanId=${id}`}>
                <Button size="lg" className="w-full md:w-auto">
                  تسجيل الدخول لإنشاء طلب
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
