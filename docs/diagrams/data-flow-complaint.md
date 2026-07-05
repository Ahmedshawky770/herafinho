# Data Flow Diagram - Complaints & Moderation (3 Strikes Auto-Ban)

```mermaid
flowchart TD
    Start([Client / العميل]) --> FileComplaint[إبلاغ عن حرفي<br/>Complaint Form]

    FileComplaint --> SelectReason{اختيار السبب}
    SelectReason -->|no_show| ChooseReason
    SelectReason -->|bad_service| ChooseReason
    SelectReason -->|overpriced| ChooseReason
    SelectReason -->|harassment| ChooseReason
    SelectReason -->|fraud| ChooseReason
    SelectReason -->|other| ChooseReason

    ChooseReason[تعبئة النموذج<br/>- السبب<br/>- الوصف<br/>- الأدلة (صور/فيديو)<br/>- ربط الطلب (اختياري)]
    ChooseReason --> Validate[Validação مع Zod]
    Validate -->|invalid| ReturnErrors[عرض أخطاء]<-->ChooseReason
    Validate -->|valid| SaveComplaint[INSERT complaints<br/>status = 'pending'<br/>action_taken = NULL]

    SaveComplaint --> NotifyAdmin[إشعار الأدمن<br/>NotificationService.send()]
    NotifyAdmin --> AdminFreezes{الإدمان يختار إجراء}
    AdminFreezes -->|تحذير| Warning[Action = 'warning'<br/>Sendwarning notification + email]
    AdminFreezes -->|تجميد| Freeze[Action = 'freeze'<br/>freeze_until = NOW + 30d<br/>freeze_count++<br/>Update craftsman_profiles]
    AdminFreezes -->|حظر نهائي| PermBan[Action = 'permanent_ban'<br/>is_deleted = true<br/>Update users.is_deleted]

    Freeze --> CheckCount{freeze_count >= 3?}
    CheckCount -->|yes| AutoBan[✅ AUTO-BAN<br/>is_deleted = true<br/>Send ban email<br/>Disable all devices]
    CheckCount -->|no| UnfreezeLater[Craftsman ينشئ طلب Unfreeze<br/>Admin reviews<br/>Unfreeze if justified]

    PermBan --> BlockPermanently[🔴 نهائي: <br/>- cannot login<br/>- Archived profile<br/>- Order history: archived as is<br/>- Reviews deleted (or kept anonymized)]

    Warning --> End([النهاية])
    Freeze --> End
    UnfreezeLater --> End
    AutoBan --> End
    BlockPermanently --> End

    rect rgb(255, 251, 240)
        subgraph "المبررات للإجراءات"
            sanction_reasons["تحذير (Warning)<br/>  - إهمال بسيط / تأخر<br/>  - سلوك غير لائق بسيط<br/>  - لا تأثير على قبول/رفض<br/><br/>تجميد (Freeze)<br/>  - تأخر متكرر (>2)<br/>  - شكوى صالحة (ثابتة)<br/>  - تعامل سيء<br/><br/>حظر (Ban)<br/>  - احتيال / False Advertising<br/>  - اعتداء جسدي / تحرش<br/>  - احتيال مالي<br/>  - 3 تجميدات تلقائية → Auto-ban"]
        end
    end

    style Start fill:#10b981,color:white
    style Warning fill:#f59e0b,color:black
    style Freeze fill:#f59e0b,color:black
    style AutoBan fill:#ef4444,color:white
    style PermBan fill:#ef4444,color:white
```

---

## Moderation Action Matrix

| Reason | Severity | Action (1st Occurrence) | Recurrence Action |
|--------|----------|-------------------------|-------------------|
| **no_show** | Medium | Warning | Freeze → Ban (after 3) |
| **bad_service** | Low-Medium | Warning | Freeze → Ban |
| **overpriced** | Low | Warning only | — |
| **harassment** | High | Freeze (14d) | Ban on repeat |
| **fraud** | Critical | Permanent Ban | N/A |
| **other** | Variable | Admin discretion | N/A |

---

## 3-Strike Flow (Detailed)

```typescript
// features/complaints/use-cases/process-complaint.usecase.ts
export async function processComplaintResolution(
  complaintId: string,
  action: 'warning' | 'freeze' | 'permanent_ban',
  adminId: string,
  reason?: string
) {
  const complaint = await complaintsRepository.findById(complaintId);
  if (!complaint) throw new NotFoundError('Complaint not found');

  // Update complaint resolution
  await complaintsRepository.update(complaintId, {
    status: 'resolved',
    actionTaken: action,
    resolvedBy: adminId,
    resolvedAt: new Date(),
  });

  switch (action) {
    case 'warning':
      await warningService.send(complaint.againstUserId, complaint.reason);
      break;

    case 'freeze':
      const craftsman = await craftsmanRepository.findProfileByUserId(complaint.againstUserId);
      const newFreezeCount = (craftsman.freezeCount || 0) + 1;
      const freezeUntil = addDays(new Date(), 30);

      await craftsmanRepository.updateProfile(complaint.againstUserId, {
        status: 'frozen',
        freezeUntil,
        freezeReason: complaint.reason,
        freezeCount: newFreezeCount,
      });

      // 3-Strikes Auto-Ban
      if (newFreezeCount >= 3) {
        await craftsmanRepository.ban(complaint.againstUserId);
        await notificationService.send({
          userId: complaint.againstUserId,
          type: 'email',
          title: 'تم حظر حسابك نهائياً',
          body: `لقد تم حظر حسابك بسبب تجميد 3 مرات. السبب: ${complaint.reason}`,
        });
        // Trigger webhooks for data purge
        await webhookService.dispatch('craftsman.banned', { userId: complaint.againstUserId });
      } else {
        await notificationService.send({
          userId: complaint.againstUserId,
          type: 'in_app',
          title: 'تم تجميد حسابك',
          body: `تم تجميد حسابك لمدة 30 يوم بسبب ${complaint.reason}. المزيد من التفاصيل على بريدك.`,
        });
      }
      break;

    case 'permanent_ban':
      await craftsmanRepository.ban(complaint.againstUserId);
      await notificationService.send({
        userId: complaint.againstUserId,
        type: 'email',
        title: 'تم حظر حسابك',
        body: `تم حظر حسابك نهائياً بسبب: ${reason}`,
      });
      await userRepository.softDelete(complaint.againstUserId);
      await webhookService.dispatch('craftsman.banned', { userId: complaint.againstUserId });
      break;
  }

  // Audit trail
  await auditService.log({
    actorId: adminId,
    action: 'admin_' + action,
    targetType: 'craftsman_profile',
    targetId: complaint.againstUserId,
    metadata: { complaintId, reason, freezeCount: action === 'freeze' ? newFreezeCount : undefined },
  });
}
```

---

## UI: Moderation Action Form (Admin)

```tsx
// features/admin/components/moderation-action-form.tsx
export function ModerationActionForm({ complaintId }: { complaintId: string }) {
  const [action, setAction] = useState<'warning' | 'freeze' | 'permanent_ban'>('warning');
  const [reason, setReason] = useState('');

  return (
    <Card>
      <CardHeader>
        <h3>اتخاذ إجراء</h3>
        <p>اختر الإجراء ضد الحرفي المتهم</p>
      </CardHeader>
      <CardContent>
        <Tabs value={action} onValueChange={setAction}>
          <TabsList>
            <TabsTrigger value="warning">⚠️ تحذير</TabsTrigger>
            <TabsTrigger value="freeze">❄️ تجميد</TabsTrigger>
            <TabsTrigger value="permanent_ban">🔴 حظر نهائي</TabsTrigger>
          </TabsList>

          <TabsContent value="warning">
            <Input placeholder="سبب التحذير" {...field} />
            <p className="text-sm text-muted-foreground">
              سيتم إرسال إشعار للحرفي. لا يؤثر على إمكانية استلام طلبات.
            </p>
          </TabsContent>

          <TabsContent value="freeze">
            <Input placeholder="سبب التجميد" {...field} />
            <p className="text-sm text-orange-600">
              تجميد 30 يوم. تلقائياً يصبح حظر بعد 3 تجميدات (Auto-ban).
            </p>
          </TabsContent>

          <TabsContent value="permanent_ban">
            <Textarea placeholder="سبب الحظر النهائي" {...field} />
            <p className="text-sm text-red-600">
              ⚠️ إجراء لا رجعة فيه. الحرفي لن يستطيع تسجيل الدخول مرة أخرى.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={() => submitModerationAction({ action, reason, complaintId })}>
          تنفيذ الإجراء
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## Notification Templates

| Template | Subject | When Sent |
|----------|---------|-----------|
| **complaint_filed_client** | "تم تقديم شكواك" | To client (reporter) |
| **complaint_filed_craftsman** | "تم تقديم شكوى ضدك" | To craftsman (immediate) |
| **moderation_warning** | "تحذير إداري" | To craftsman (warning action) |
| **moderation_freeze** | "تم تجميد حسابك {30 يوم}" | Auto | To craftsman (freeze action) |
| **moderation_auto_ban** | "تم حظر حسابك نهائياً" | Auto | To craftsman (3 strikes) |
| **moderation_resolved** | "تم حل شكواك" | To client (resolved) |
| **moderation_resolved_admin** | "تم حل الشكوى #{id}" | To admin team (confirmation) |

---

## Invariants (قواعد لا تُنكسر)

1. **لا يمكن حظر حساب عليه طلبات نشطة (في Progress)**
   - Admin يجب أن يكمل/يلغي الطلب أولاً

2. **لا يمكن حظر الحرفي إذا كان لديه تقييمات مُبدّلة**
   - التقيمات المحذوفة = لا، التقيمات المثبتة = نعم (مجموع Reviews نظراً)

3. **Auto-ban لا يمكن التراجع عنه**
   - لا يوجد زر "undo" للـ 3 Strikes Auto-Ban
   - HTML/CSS: button με className="disabled"

4. **Soft Delete للمستخدم = Soft Delete لكل بياناته**
   - ON DELETE CASCADE: complaints, reviews تسقط عند delete المستخدم
   - على الريبو: `await craftmanRepository.ban(userId)` يحذف كل الحسابات

5. **Webhook dispatch on ban**
   - بعد الحظر، يتم إرسال webhook لتنظيف الـ Cache الخارجي

---

## Webhook Dispatch on Ban

```typescript
// Triggered after any ban action
await webhookService.dispatch('craftsman.banned', {
  eventId: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  userId: craftsman.userId,
  reason: complaint.reason,
  action: 'permanent_ban',
  metadata: {
    craftType: craftsman.craftType,
    experienceYears: craftsman.experienceYears,
    totalOrders: craftsman.totalOrders,
    averageRating: craftsman.averageRating,
  },
});
```

---

## Monitoring & Alerts

| Alert | Trigger | Action |
|-------|---------|--------|
| **High complaint rate** | > 10 complaints on single craftsman in 24h | Flag for admin review |
| **3-Freeze pattern** | freeze_count reaches 3 | Auto-ban + webhook + notify admin |
| **Absurd rating drop** | Rating drops > 2 points in 7 days from 4+ | Investigate anomaly |
| **Complaint without order** | Complaint filed with no linked order | Reject complaint (pending) |

---

## Related Documents
- [Data Flow - Order](data-flow-order.md)
- [Data Flow - Onboarding](data-flow-onboarding.md)
- [C4 L3 - Component](c4-l3-component-internal.md)
- [Webhook Architecture](webhook-architecture.md)
- [Plan](plan.md)
