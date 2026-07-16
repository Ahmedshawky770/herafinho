'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, craftTypeLabel, CraftsmanStatusBadge } from '@/components/features/common/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { OnboardingWizard } from '@/components/features/craftsman/onboarding-wizard';
import { useFileUpload } from '@/hooks';
import { User, IdCard, Car, MapPin, Save, Camera } from 'lucide-react';
import { useState } from 'react';
import type { CraftsmanStatus, CraftType, TransportType } from '@herafino/types';

const CRAFT_TYPES: CraftType[] = [
  'carpenter', 'plumber', 'painter', 'electrician', 'welder', 'tiler',
  'ceramicist', 'whitewasher', 'hvac', 'satellite', 'aluminum',
];
const TRANSPORT_TYPES: TransportType[] = ['bike', 'walking', 'car', 'minivan'];
const TRANSPORT_LABELS: Record<TransportType, string> = {
  bike: 'موتوسيكل', walking: 'سيراً', car: 'سيارة', minivan: 'ميني فان',
};

type Profile = {
  id: string;
  craftType: CraftType;
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
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ['craftsman-profile'], queryFn: fetchProfile });

  const [form, setForm] = useState({
    craftType: 'carpenter' as CraftType,
    experienceYears: 1,
    transportType: 'bike' as TransportType,
    vehicleNumber: '',
    workshopAddress: '',
  });

  const [idFront, idFrontUp] = useFileUpload({ fileType: 'id_card' });
  const [idBack, idBackUp] = useFileUpload({ fileType: 'id_card' });
  const [face, faceUp] = useFileUpload({ fileType: 'face_photo' });

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/craftsmen/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'فشل الحفظ');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['craftsman-profile'] });
      queryClient.invalidateQueries({ queryKey: ['craftsman-me'] });
    },
  });

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="الملف الشخصي" description="أكمل بياناتك لتوثيق حسابك" />
        <OnboardingWizard step={1} onNext={() => {}} />
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <User className="size-4 text-primary" /> بيانات الحرفي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="label">نوع الحرفة</label>
              <Select
                value={form.craftType}
                onChange={(e) => setForm((f) => ({ ...f, craftType: e.target.value as CraftType }))}
              >
                {CRAFT_TYPES.map((t) => (
                  <option key={t} value={t}>{craftTypeLabel(t)}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="label">سنوات الخبرة</label>
              <Input
                type="number"
                min={0}
                value={form.experienceYears}
                onChange={(e) => setForm((f) => ({ ...f, experienceYears: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="label">وسيلة النقل</label>
              <Select
                value={form.transportType}
                onChange={(e) => setForm((f) => ({ ...f, transportType: e.target.value as TransportType }))}
              >
                {TRANSPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{TRANSPORT_LABELS[t]}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="label">رقم المركبة (اختياري)</label>
              <Input
                value={form.vehicleNumber}
                onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">عنوان الورشة</label>
              <Input
                value={form.workshopAddress}
                onChange={(e) => setForm((f) => ({ ...f, workshopAddress: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <UploadField label="وجه البطاقة" icon={IdCard} state={idFront} onUpload={idFrontUp} />
              <UploadField label="ظهر البطاقة" icon={IdCard} state={idBack} onUpload={idBackUp} />
              <UploadField label="صورة الوجه" icon={Camera} state={face} onUpload={faceUp} />
            </div>

            <Button
              className="w-full"
              disabled={saveMutation.isPending || !form.workshopAddress}
              onClick={() =>
                saveMutation.mutate({
                  ...form,
                  idCardFrontUrl: idFront.url ?? 'pending',
                  idCardBackUrl: idBack.url ?? 'pending',
                  facePhotoUrl: face.url ?? 'pending',
                  transportPhotos: [],
                  workshopLatitude: '0',
                  workshopLongitude: '0',
                })
              }
            >
              <Save className="size-4" />
              {saveMutation.isPending ? 'جارٍ الإرسال…' : 'إرسال للمراجعة'}
            </Button>
            {saveMutation.isError && (
              <p className="text-sm text-red-600">{(saveMutation.error as Error).message}</p>
            )}
          </CardContent>
        </Card>
      </div>
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

function UploadField({
  label,
  icon: Icon,
  state,
  onUpload,
}: {
  label: string;
  icon: React.ElementType;
  state: { uploading: boolean; url: string | null; progress: number; error: string | null };
  onUpload: (f: File) => Promise<void>;
}) {
  return (
    <div className="space-y-1">
      <label className="label">{label}</label>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 p-3 text-center transition-colors hover:border-primary">
        <Icon className="size-5 text-gray-400" />
        <span className="text-xs text-gray-500">
          {state.uploading ? `${state.progress}%` : state.url ? 'تم الرفع' : 'ارفع صورة'}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onUpload(f);
          }}
        />
      </label>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
