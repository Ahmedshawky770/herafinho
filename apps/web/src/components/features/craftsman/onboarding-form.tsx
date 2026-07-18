'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageHeader, craftTypeLabel } from '@/components/features/common/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { OnboardingWizard } from '@/components/features/craftsman/onboarding-wizard';
import { useFileUpload } from '@/hooks';
import { User, IdCard, MapPin, Save, Camera, LocateFixed } from 'lucide-react';
import { useState } from 'react';
import type { CraftType, TransportType } from '@herafino/types';

const CRAFT_TYPES: CraftType[] = [
  'carpenter', 'plumber', 'painter', 'electrician', 'welder', 'tiler',
  'ceramicist', 'whitewasher', 'hvac', 'satellite', 'aluminum',
];
const TRANSPORT_TYPES: TransportType[] = ['bike', 'walking', 'car', 'minivan'];
const TRANSPORT_LABELS: Record<TransportType, string> = {
  bike: 'موتوسيكل', walking: 'سيراً', car: 'سيارة', minivan: 'ميني فان',
};

export function OnboardingForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [form, setForm] = useState({
    craftType: 'carpenter' as CraftType,
    experienceYears: 1,
    transportType: 'bike' as TransportType,
    vehicleNumber: '',
    workshopAddress: '',
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const [idFront, idFrontUp] = useFileUpload({ fileType: 'id_card' });
  const [idBack, idBackUp] = useFileUpload({ fileType: 'id_card' });
  const [face, faceUp] = useFileUpload({ fileType: 'face_photo' });

  const uploadsReady = Boolean(idFront.url && idBack.url && face.url);
  const locationReady = coords !== null;
  const canSubmit = Boolean(form.workshopAddress && uploadsReady && locationReady);

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['craftsman-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['craftsman-me'] });
      await updateSession();
      router.refresh();
      onSubmitted?.();
    },
  });

  const step = uploadsReady ? 3 : form.workshopAddress ? 2 : 1;

  function detectLocation() {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="إعداد الحساب" description="أكمل بياناتك ووثائقك لتوثيق حسابك" />
      <OnboardingWizard step={step} />
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

          <div className="rounded-lg border border-gray-100 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="size-4 text-primary" /> موقع الورشة
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={detectLocation}
                disabled={locating}
              >
                <LocateFixed className="size-4" />
                {locating ? 'جارٍ التحديد…' : coords ? 'تم التحديد' : 'تحديد موقعي'}
              </Button>
            </div>
            {!coords && (
              <p className="text-xs text-gray-500">يجب تحديد موقع الورشة لإتمام التسجيل.</p>
            )}
          </div>

          <Button
            className="w-full"
            disabled={saveMutation.isPending || !canSubmit}
            onClick={() =>
              saveMutation.mutate({
                ...form,
                idCardFrontUrl: idFront.url,
                idCardBackUrl: idBack.url,
                facePhotoUrl: face.url,
                transportPhotos: [],
                workshopLatitude: String(coords?.lat ?? '0'),
                workshopLongitude: String(coords?.lng ?? '0'),
              })
            }
          >
            <Save className="size-4" />
            {saveMutation.isPending ? 'جارٍ الإرسال…' : 'إرسال للمراجعة'}
          </Button>
          {!canSubmit && !saveMutation.isPending && (
            <p className="text-xs text-gray-500">
              أكمل جميع البيانات (نوع الحرفة، العنوان، رفع صور الهوية الثلاث، وتحديد الموقع) قبل الإرسال.
            </p>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-red-600">{(saveMutation.error as Error).message}</p>
          )}
        </CardContent>
      </Card>
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
