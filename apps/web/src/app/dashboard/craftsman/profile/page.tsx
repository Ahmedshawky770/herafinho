'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PageHeader, craftTypeLabel, CraftsmanStatusBadge } from '@/components/features/common/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingForm } from '@/components/features/craftsman/onboarding-form';
import { User, Car, MapPin } from 'lucide-react';
import type { CraftsmanStatus, TransportType } from '@herafino/types';

const TRANSPORT_LABELS: Record<TransportType, string> = {
  bike: 'موتوسيكل', walking: 'سيراً', car: 'سيارة', minivan: 'ميني فان',
};

type Profile = {
  id: string;
  craftType: string;
  experienceYears: number;
  status: CraftsmanStatus;
  transportType: TransportType;
  vehicleNumber?: string;
  workshopAddress: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  facePhotoUrl: string;
};

async function fetchProfile(): Promise<Profile | null> {
  const res = await fetch('/api/craftsmen/me');
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export default function CraftsmanProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ['craftsman-profile'], queryFn: fetchProfile });

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;

  if (!profile) {
    return (
      <OnboardingForm
        onSubmitted={() => {
          queryClient.invalidateQueries({ queryKey: ['craftsman-profile'] });
          router.push('/dashboard/craftsman');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الملف الشخصي"
        description="بيانات حسابك الموثّق"
        action={<CraftsmanStatusBadge status={profile.status} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <User className="size-4 text-primary" /> التفاصيل
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow icon={User} label="المهنة" value={craftTypeLabel(profile.craftType)} />
            <InfoRow icon={Car} label="وسيلة النقل" value={TRANSPORT_LABELS[profile.transportType]} />
            <InfoRow icon={MapPin} label="عنوان الورشة" value={profile.workshopAddress} />
            {profile.vehicleNumber && (
              <InfoRow icon={Car} label="رقم المركبة" value={profile.vehicleNumber} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">الوثائق</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DocPreview label="وجه البطاقة" url={profile.idCardFrontUrl} />
            <DocPreview label="ظهر البطاقة" url={profile.idCardBackUrl} />
            <DocPreview label="صورة الوجه" url={profile.facePhotoUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-1 font-medium text-gray-900">{value}</p>
    </div>
  );
}

function DocPreview({ label, url }: { label: string; url: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="h-32 w-full object-cover" />
      <p className="bg-gray-50 px-3 py-1.5 text-xs text-gray-600">{label}</p>
    </div>
  );
}
