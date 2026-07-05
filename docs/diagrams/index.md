# Architecture Diagrams - Overview

## Diagrams Index

| # | Diagram | Description | Link |
|---|---------|-------------|------|
| 1 | [C4 Level 1 - System Context](c4-l1-system-context.md) | High-level view of the system and its external actors | [View](c4-l1-system-context.md) |
| 2 | [C4 Level 2 - Container](c4-l2-container-deployment.md) | Deployment architecture: Next.js, PostgreSQL, Valkey, Workers | [View](c4-l2-container-deployment.md) |
| 3 | [C4 Level 3 - Component](c4-l3-component-internal.md) | Modular Monolith internal structure | [View](c4-l3-component-internal.md) |
| 4 | [Entity Relationship Diagram](erd.md) | Complete database schema with tables and relationships | [View](erd.md) |
| 5 | [Craftsman Onboarding Flow](data-flow-onboarding.md) | Data flow & sequence for craftsman onboarding & approval | [View](data-flow-onboarding.md) |
| 6 | [Google OAuth Login Sequence](seq-google-oauth.md) | Sequence diagram for login flow | [View](seq-google-oauth.md) |
| 7 | [Realtime Location Broadcast](seq-realtime-location.md) | WebSocket + Geolocation real-time flow | [View](seq-realtime-location.md) |
| 8 | [Order Lifecycle](data-flow-order.md) | Client request → Craftsman accept → Complete | [View](data-flow-order.md) |
| 9 | [Complaint & Moderation](data-flow-complaint.md) | Complaint filing → Investigation → 3 Strikes Ban | [View](data-flow-complaint.md) |
| 10 | [Caching Architecture](caching-strategy.md) | Valkey + React Query cache layers | [View](caching-strategy.md) |
| 11 | [Deployment Pipeline](deployment-pipeline.md) | Docker Compose + CI/CD pipeline | [View](deployment-pipeline.md) |
| 12 | [Webhook Architecture](webhook-architecture.md) | Outgoing & incoming webhooks flow | [View](webhook-architecture.md) |

---

## المبادئ الهندسية المطبقة في كل Diagram

| المبدأ | التطبيق في الـ Diagrams |
|--------|------------------------|
| **1. لا any / as any** | جميع الـ Types محددة بدقة في كل Contract |
| **2. Logger بدلاً من console** | كل خدمة تستخدم Pino مع Request ID |
| **3. IDs كـ string** | جميع الـ IDs في الـ Diagrams معرّفة كـ string |
| **4. ADRs** | كل Diagram مرافق بـ ADR يشرح القرار |
| **5. Design First** | يتم رسم كل Diagram قبل كتابة كود |
| **6. Minimize DB Migrations** | Schema مصمم بعناية لتجنب Breaking Changes |
| **7. Loose Coupling** | الوحدات تتكلم عبر Events و Interfaces |
| **8. Open/Closed Principle** | كل Module قابل للتوسع بدون تعديل |
| **9. SSOT** | PostgreSQL = SSOT، Valkey = Cache |
| **10. Unified Typing** | Types موحدة في `/packages/types/` |
| **11. Valkey Cache** | Valkey = Cache Layer + Distributed Queue |
| **12. No Cascade Failures** | Circuit Breaker + Retry + Fallback |
| **13. Automation** | سكريبتات للتعديلات الضخمة |

---

## كيف تستخدم هذه الـ Diagrams

### للمطورين
```bash
# تشغيل خدمة Diaspora المحلية (إذا رغبت)
# يمكنك تحويل هذه الملفات إلى .drawio أو .excalidraw

# لعرض الـ Mermaid locally:
# استخدم VS Code Extension: "Markdown Preview Mermaid"

# لعرض PlantUML:
# استخدم VS Code Extension: "PlantUML"
```

### للـ Review
- كل Diagram موثق بـ **مصطلحات عربية** + **الإنجليزية** للمواصفات
- كل Diagram مرتبط بقسم في `docs/plan.md`
- كل Diagram يحتوي على **نطاق (Scope)** واضح

---

## agreed Format للـ Diagrams

### C4 Model
- **C4 Online**: https://c4model.com/diagrams/
- **الأدوات**: Excalidraw، Draw.io، Mermaid (للـ GitHub)
- **المستويات**:
  - Level 1: System Context
  - Level 2: Container (Deployment)
  - Level 3: Component (Module Boundaries)
  - Level 4: Code (بهذا المشروع نكفي بـ Level 3)

### Sequence Diagrams
- **الأدوات**: PlantUML، Mermaid
- **النطاق**: flow واحد متسلسل (عاديًا 8-15 خطوة كحد أقصى)
- **المصطلحات**: Actors, Messages, Returns, Activation Bars, Notes

### ERD
- **الأدوات**: Draw.io، dbdiagram.io، PlantUML
- **المصطلحات**: Tables, Columns, PK, FK, Indexes, Relationships
- **العلاقات**: One-to-Many, Many-to-Many, One-to-One

---

## Next Steps
1. نفّذ Phase 1 من `docs/plan.md` (الأسبوع 1-2)
2. أثناء التنفيذ، حدّث الـ Diagrams عند كل تغيير معماري
3. استخدم هذا المجلد كمرجع **Design Guide** عند كل PR
4. قبل أي Merge، تأكد أن الـ Diagrams محدّثة

---

## ملاحظات
- هذه الـ Diagrams هي **عقد معماري Architecture Contracts**
- أي تعديل عليها يتطلب **ADR جديد** + فريق review
- الهدف: **كل مطور يفتح الـ Diagram ويُفهم النظام في 30 ثانية**
