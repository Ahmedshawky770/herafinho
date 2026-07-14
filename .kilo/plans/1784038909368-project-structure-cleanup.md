# خطة: ترتيب بنية المشروع (5 إصلاحات هيكلية)

## السياق (Context)
مونوريبو (Turborepo + npm workspaces) بهيكل ناضج. أثناء المراجعة وُجدت 5 مشاكل هيكلية:
1. سكربت `db:seed` معطوب يشير لملف غير موجود.
2. ملفات مكررة (dead code) في `apps/web/src/lib` تُكرّر كود `@herafino/shared`.
3. مصادر أنواع متعددة: `docs/api-contracts/*.types.ts` تُكرّر `packages/types`.
4. انحراف الوثائق: README/plan/docs تقول Next.js 14 + NextAuth v5 بينما الفعلي Next.js 16 + next-auth v4.
5. 3 ملفات `drizzle.config` مكررة.

**القاعدة الهيكلية (Single Source of Truth):**
- `packages/types` ← أنواع Zod (مصدر الأنواع).
- `packages/shared` ← التنفيذ + `schema.ts` + `migrations/` + `seed.ts` (يملك قاعدة البيانات).
- `packages/contracts` ← واجهات (interfaces) فقط.
- كل كود التطبيق يستورد أصلًا من `@herafino/shared` / `@herafino/types`، إذًا ملفات `lib` المكررة هي **كود ميت**.

---

## المهمة 1 — إصلاح مسار `db:seed`
البذر الفعلي موجود في `packages/shared/src/db/seed.ts` (يستورد `db`/`users`/`logger` نسبيًا داخل shared ⇒ يعمل من جذر shared).

**التغييرات:**
- `packages/shared/package.json`: أضف السكربت `"db:seed": "tsx src/db/seed.ts"` وأضف `"tsx": "^4.23.0"` إلى `devDependencies` (ليطابق إصدار web).
- `turbo.json`: غيّر `"db:seed".package` من `["@herafino/web"]` إلى `["@herafino/shared"]`.
- `apps/web/package.json`: احذف `"db:seed": "tsx src/lib/db/seed.ts"` (الملف غير موجود).

**لماذا shared وليس web:** البذر يعتمد على `schema.ts` و`db` اللذين يملكهما shared؛ وضع السكربت هناك يوحد الملكية.

---

## المهمة 2 — حذف الملفات المكررة في `apps/web/src/lib`
تم التحقق عبر grep: لا يوجد أي استيراد لهذه الملفات (كل المسارات تستورد من `@herafino/shared`).

**حذف (dead duplicates):**
- `apps/web/src/lib/http/error-handler.ts` (مكرر `packages/shared/src/http/error-handler.ts`)
- `apps/web/src/lib/http/index.ts` (يعيد تصدير السابق فقط)
- `apps/web/src/lib/db/repositories/notification.repository.ts` (نسخة قديمة ناقصة من `packages/shared/src/repositories/notification.repository.ts`)
- `apps/web/src/lib/storage/types.ts` (مكرر `packages/shared/src/storage/types.ts`)
- `apps/web/src/lib/index.ts` (shim إعادة تصدير ميت)
- `apps/web/src/lib/shared-index.ts` (shim إعادة تصدير ميت)

**إصلاح (وليس حذف):**
- `apps/web/src/lib/storage/storage-service.ts` السطر 4: استبدل تعريف `UploadFileType` المحلي بـ:
  `import type { UploadFileType } from '@herafino/shared/storage/types';`

**الإبقاء (خاص بالتطبيق، ليس مكررًا):**
- `apps/web/src/lib/storage/storage-service.ts` (منطق S3 — يُصلح فقط)
- `apps/web/src/lib/storage/index.ts`، `apps/web/src/lib/services/*` (email.service.ts خاص بـ Resend)
- `apps/web/src/lib/utils.ts` (`cn` — يُستخدم بكثرة عبر `@/lib/utils`)

**فحص إضافي (لا يُحذف تلقائيًا):** `apps/web/src/lib/db/index.ts` ينشئ عميل Drizzle ثانٍ مستقل. تحقق عبر grep من استخدامه (`@/lib/db`). إن كان ميتًا، احذفه لتجنّب عميل DB ثانٍ (shared يملك `db`).

---

## المهمة 3 — مصدر واحد للأنواع
`docs/api-contracts/*.types.ts` (auth/complaint/craftsman/order/review) تُكرّر أنواع `packages/types` ولا تُستورد من أي كود تطبيقي (تُستورد فقط من بعضها).

**القرار الموصى به:** حذف ملفات الأنواع المكررة فقط، والإبقاء على `docs/api-contracts/openapi.yaml` (مواصفة API مستقلة لا تستورد ملفات TS).
- احذف: `docs/api-contracts/auth.types.ts`, `complaint.types.ts`, `craftsman.types.ts`, `order.types.ts`, `review.types.ts`.
- احتفظ بـ `openapi.yaml` (مرجع API مكتوب يدويًا).
- حدّث المراجع: `docs/README.md:50` و`docs/project-structure.md:396` و`docs/structure.md:253` لتوضيح أن **مصدر الأنواع الرسمي هو `packages/types`** (وليس `docs/api-contracts`).

**البديل (إن أُريد حذف كامل):** احذف مجلد `docs/api-contracts/` بالكامل وحدّث الروابط في `docs/README.md`.

---

## المهمة 4 — تحديث README وdocs إلى Next 16 / NextAuth v4
القيمة الفعلية في `apps/web/package.json`: `next: ^16.2.10`, `next-auth: ^4.24.14`.

**التحديثات (استبدل 14→16 و v5→v4):**
- `README.md:15` (Stack) وكتلة Architecture ص48.
- `docs/plan.md:44,131,139,903` ("Next.js 14+" → "Next.js 16+", "NextAuth v5" → "NextAuth v4").
- `docs/diagrams/c4-l2-container-deployment.md:14,49`, `docs/diagrams/c4-l3-component-internal.md:101` ("Next.js 14" → "Next.js 16").

**تعارض يجب رفعه (ADR-004):** الملف `docs/adr/004_why_nextauth.md` بعنوان "Choosing NextAuth v5" ويجادل لصالح v5، بينما المثبّت فعليًا v4. هذا تناقض.
- الإجراء: حدّث نص الوثائق السردية إلى v4 (يعكس الواقع)، وأضف ملاحظة حالة في أعلى ADR-004: "Implemented version: next-auth v4 (القرار الأصلي كان v5؛ عُدّل التنفيذ إلى v4)." لا تعدّل مبررات الـADR نفسها.

---

## المهمة 5 — توحيد `drizzle.config`
الملف الكنسي هو `packages/shared/drizzle.config.json` (schema + migrations داخل shared).
- `apps/web/drizzle.config.json` يولّد في مجلد migrations الخاص بـ shared ⇒ مكرر/متعارض → **احذفه**.
- `drizzle.config.json` في الجذر ← غير مستخدم (لا سكربت db في الجذر) → **احذفه**.
- `apps/web/package.json`: احذف `db:generate`, `db:migrate`, `db:studio` (shared يملكها؛ turbo يشغّلها عبر `package: ["@herafino/shared"]`). يبقى `db:seed` محذوفًا من المهمة 1.
- الإبقاء على `packages/shared/drizzle.config.json` فقط.

---

## التحقق (Validation)
1. `npm install` (يضيف `tsx` إلى shared).
2. `npm run typecheck` (turbo) — يجب أن ينجح بلا أخطاء.
3. `npm run lint`.
4. `npm run db:generate` ← يُشغَّل في `@herafino/shared` فقط (لا تعارض).
5. `npm run db:seed` ← يُشغَّل في `@herafino/shared`.
6. grep تأكيدي: لا نتائج لـ
   `lib/http`, `lib/db/repositories/notification`, `lib/storage/types`, `shared-index`, `api-contracts` داخل كود `apps/web/src` أو استيرادات التطبيق.
7. `npm run build` (اختياري للتأكيد النهائي).

## مخاطر / أسئلة مفتوحة
- **ADR-004:** تعارض v5 (موثّق) vs v4 (مثبّت). القرار أعلاه يحافظ على الـADR كمبرر تاريخي مع ملاحظة التنفيذ. إن كان المطلوب تصحيح الـADR نفسه، يلزم قرار صريح.
- **`apps/web/src/lib/db/index.ts`:** قد يكون عميل DB ميتًا مكررًا — تحقق قبل الحذف.
- لا توجد تغييرات سلوكية (كل الملفات المحذوفة ميتة ومستبدَلة بـ `@herafino/shared`).
