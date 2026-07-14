# C4 Model - Level 3: Component (Modular Monolith Internal)

```mermaid
C4Component
    title Component Diagram - Harfino Nexus Internal (Modular Monolith)

    Person(client, "طالب حرفة (Client)", "يطلب خدمات + يقيّم")
    Person(craftsman, "حرفي", "يكمل Onboarding + يقبل طلبات + يشارك موقعه")
    Person(admin, "Admin", "يراجع + يحقق + يتخذ قرار")
    System_Ext(external, "خدمات خارجية<br/>(OAuth, Google Maps,\nResend, Sentry)")

    System_Boundary(herafino_system, "Harfino Modular Monolith") {
        System_Ext(none, "External Services", "OAuth, Maps, Email, Sentry")

        Container_Boundary(nextjs_nexus, "Next.js Nexus (Main App)") {
            Component(web_handler, "Web Handlers", "Next.js RSC/Pages Router", "واجهات المستخدم: الموبايل + Desktop + PWA")

            Container_Boundary(api_routes, "API & WebSocket Routes") {
                Component(auth_controller, "Auth Routes", "Next.js Route Handlers", "Google OAuth + NextAuth callbacks + signIn/signOut")
                Component(user_controller, "User Routes", "Next.js Route Handlers", "CRUD المستخدم")
                Component(craftsman_controller, "Craftsman Routes", "Next.js Route Handlers", "Onboarding, موافقة, رفض, تحديث الملف")
                Component(order_controller, "Order Routes", "Next.js Route Handlers", "إنشاء طلب، قبول، رفض، إكمال")
                Component(review_controller, "Review Routes", "Next.js Route Handlers", "إنشاء مراجعة + تقييم")
                Component(complaint_controller, "Complaint Routes", "Next.js Route Handlers", "شكوى، تحقيق، قرار")
                Component(ws_handler, "WebSocket Routes", "ws + Next.js", "إدارة WebSocket connections + broadcast")
                Component(admin_controller, "Admin Controller", "Next.js Route Handlers", "لوحة تحكم الأدمن + CRUD")
            }

            Container_Boundary(use_cases_layer, "Application Layer (Use Cases)") {
                Component(register_craftsman_uc, "RegisterCraftsmanUC", "Use Case", "إدارة عملية التسجيل + Onboarding")
                Component(approve_craftsman_uc, "ApproveCraftsmanUC", "Use Case", "موافقة + رفض + إرسال بريد")
                Component(create_order_uc, "CreateOrderUC", "Use Case", "عميل يطلب خدمة")
                Component(accept_order_uc, "AcceptOrderUC", "Use Case", "حرفي يقبل طلب")
                Component(complete_order_uc, "CompleteOrderUC", "Use Case", "إنهاء الخدمة + مراجعة")
                Component(file_complaint_uc, "FileComplaintUC", "Use Case", "شكوى + تحقيق + قرار")
                Component(update_location_uc, "UpdateLocationUC", "Use Case", "تحديث الموقع الجغرافي")
                Component(send_notification_uc, "SendNotificationUC", "Use Case", "إرسال إشعار")
            }

            Container_Boundary(infra_layer, "Infrastructure Layer") {
                Component(postgres_repo, "Postgres Repositories", "Drizzle ORM", "تنفيذ جميع الـ CRUD Operations")
                Component(valkey_cache, "Valkey Cache", "Node-valkey client", "Read-through + Write-through cache")
                Component(bullmq_queue, "BullMQ Queue", "BullMQ", "Distributed Queue للـ Background Jobs")
                Component(email_service, "Email Service", "Resend SDK", "إرسال بريد إلكتروني")
                Component(notification_service, "Notification Service", "In-app + Push", "إشعارات داخل التطبيق + Push")
                Component(websocket_service, "WebSocket Service", "ws + uWebSockets", "WebSocket connection management")
                Component(google_maps_service, "Google Maps Service", "Google Maps SDK", "Geocoding + Places")
                Component(audit_service, "Audit Service", "Audit Log", "تسجيل جميع العمليات الحساسة")
            }

            Container_Boundary(domain_layer, "Domain Layer (Pure Business Logic)") {
                Component(domain_user, "User Domain", "Entities + Value Objects + Events", "إدارة الحسابات")
                Component(domain_craftsman, "Craftsman Domain", "Entities + Value Objects + Events", "إدارة ملفات الحرفيين")
                Component(domain_order, "Order Domain", ".Entities + Value Objects + Events", "إدارة طلبات الخدمات")
                Component(domain_review, "Review Domain", "Entities + Value Objects", "التقييمات")
                Component(domain_complaint, "Complaint Domain", "Entities + Events", "الشكاوى + التحقيق")
                Component(domain_location, "Location Domain", "Entities + Value Objects", "تحديد الموقع الجغرافي")
                Component(domain_notification, "Notification Domain", "Entities + Events", "الإشعارات")
            }
        }

        ComponentDb(outbox, "Outbox Pattern", "PostgreSQL Table", "سجل الأحداث للإرسال الخارجي (Webhooks)")
        ComponentDb(event_log, "Event Log", "PostgreSQL Table", "سجل Domain Events")
    }

    Rel_Ext(auth_controller, external, "", "OAuth2.0")
    Rel_Ext(email_service, external, "إرسال بريد", "SMTP / Resend API")
    Rel_Ext(google_maps_service, external, "Geocoding", "REST / Maps API")
    Rel_Ext(notification_service, external, "Push Notifications", "FCM / APNs")

    Rel(web_handler, api_routes, "Next.js Route Handlers", "HTTPS Request")
    Rel(api_routes, use_cases_layer, "استدعاء Use Cases", "Internal")
    Rel(use_cases_layer, domain_layer, "تنفيذ Business Rules", "Internal")
    Rel(use_cases_layer, infra_layer, "تنفيذ العمليات", "Internal")
    Rel(infra_layer, postgres_repo, "استعلامات", "SQL via Drizzle")
    Rel(infra_layer, valkey_cache, "قراءة/كتابة كاش", "Redis Protocol")
    Rel(infra_layer, bullmq_queue, "إدارة Queue", "BullMQ API")
    Rel(domain_layer, event_log, "تسجيل Domain Events", "SQL INSERT")

    Rel(use_cases_layer, audit_service, "تسجيل Audit Trail", "Internal")
    Rel(audit_service, postgres_repo, "حفظ في DB", "SQL")

    Rel(craftsman, ws_handler, "WebSocket: تتبع الموقع", "ws://")
    Rel(ws_handler, websocket_service, "est conexión WebSocket", "Internal")
    Rel(websocket_service, use_cases_layer, "update_location_uc", "Internal")

    Rel(admin, admin_controller, "إدارة لوحة التحكم", "HTTPS / JSON")
```

---

## Component Boundaries

### 1. Web Handlers Layer
```
الغرض: واجهة المستخدم النهائية
المسؤولية:
  - SSR/SSG/ISR pages (App Router)
  - Client Components (React)
  - PWA manifest + service worker
التقنيات: Next.js 16 RSC/Pages, Tailwind CSS, Client-side React
المدى: الصفحات + الـ Components المرئية
```

### 2. API & WebSocket Routes
```
الغرض: مدخل (Entry Point) لكل الطلبات الخارجية
المسؤولية:
  - Auth Routes: تسجيل دخول/خروج، NextAuth callbacks
  - Resource Routes: User, Craftsman, Order, Review, Complaint CRUD
  - Admin Routes: لوحة تحكم الأدمن
  - WebSocket: إدارة WS connections, room management
التقنيات: Next.js Route Handlers (App Router)
التعاقدات (Contracts): Zod schemas للـ validation
```

### 3. Application Layer (Use Cases)
```
الغرض: تنسيق الـ Business Logic بين الـ Controllers والـ Infrastructure
المسؤولية:
  - RegisterCraftsmanUC: تسجيل حرفي جديد
  - ApproveCraftsmanUC: موافقة/رفض حرفي
  - CreateOrderUC: عميل يطلب خدمة
  - AcceptOrderUC: حرفي يقبل/يرفض طلب
  - CompleteOrderUC: إنهاء الخدمة
  - FileComplaintUC: شكوى + تحقيق
  - UpdateLocationUC: تحديث الموقع الجغرافي
  - SendNotificationUC: إرسال إشعار
التقنيات: TypeScript classes أو functions
الاستقلالية: لا تعتمد على Next.js مباشرة
```

### 4. Infrastructure Layer
```
الغرض: تنفيذ كل الاتصالات الخارجية (APIs, DB, Cache)
المسؤولية:
  - Postgres Repositories: Drizzle ORM implementations
  - Valkey Cache: Cache-aside + Write-through
  - BullMQ Queue: Distributed job queue
  - Email Service: Resend SDK wrapper
  - Notification Service: In-app + Push notification
  - WebSocket Service: Connection management
  - Audit Service: Audit trail logging
التقنيات: Drizzle ORM, node-valkey, BullMQ, Resend SDK, ws
الاعتماد: يعتمد على Contracts (Interfaces) فقط
```

### 5. Domain Layer
```
الغرض: الـ Business Logic النقي (Pure) بدون أي اعتماد على Infrastructure
المسؤولية:
  - User Domain: إدارة الحسابات
  - Craftsman Domain: ملفات الحرفيين
  - Order Domain: طلبات الخدمات
  - Review Domain: التقييمات
  - Complaint Domain: الشكاوى
  - Location Domain: الموقع الجغرافي
  - Notification Domain: الإشعارات
التقنيات: TypeScript interfaces, classes, enums, value objects
الاعتماد: صفر (Zero external deps)
الأحداث: Domain Events مسجّلة في Event Log
```

---

## Dependency Rule (Clean Architecture)

```
┌─────────────────────────────────────┐
│       External Interfaces           │
│   (Next.js, API Routes, WS)         │
└───────────────┬─────────────────────┘
                │
┌────────────────┴─────────────────────┐
│    Application Layer (Use Cases)     │
│  - Coordinates business logic        │
│  - Calls repositories               │
└───────────────┬─────────────────────┘
                │
┌────────────────┴─────────────────────┐
│      Domain Layer (Pure)             │
│  - Entities, Value Objects           │
│  - Domain Events                     │
│  - Business Rules                    │
└───────────────┬─────────────────────┘
                │
┌────────────────┴─────────────────────┐
│   Infrastructure Layer (Adapters)     │
│  - Drizzle ORM (Database)            │
│  - Valkey (Cache)                    │
│  - BullMQ (Queue)                    │
│  - Resend (Email)                    │
└──────────────────────────────────────┘
```

**القاعدة**: كل Internal Layer لا يعرف إلا الـ External Layer.  
**الهدف**: استبدال أي طبقة بدون تأثير على الطبقات الأعلى.

---

## Module Coupling Matrix

| من \ إلى | Auth | User | Craftsman | Order | Review | Complaint | Location | Notification | Admin | Webhook |
|---------|------|------|-----------|-------|--------|-----------|----------|--------------|-------|---------|
| **Auth** | — | ✅ | ✅ | — | — | — | — | ✅ | ✅ | — |
| **User** | — | — | — | — | — | — | — | — | ✅ | — |
| **Craftsman** | — | ✅ | — | — | — | — | ✅ | ✅ | ✅ | ✅ |
| **Order** | — | ✅ | ✅ | — | — | — | — | ✅ | — | ✅ |
| **Review** | — | — | ✅ | ✅ | — | — | — | — | — | — |
| **Complaint** | — | — | ✅ | ✅ | — | — | — | — | ✅ | ✅ |
| **Location** | — | — | ✅ | — | — | — | — | — | — | — |
| **Notification** | — | — | — | — | — | — | — | — | — | — |
| **Admin** | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| **Webhook** | — | — | — | — | — | — | — | — | — | — |

> SQL SELECT ✅ = Relationship via Contract/Interface  
> ✅ = Used (indirectly via Events/Contracts)  
> — = No direct dependency

---

## Related Documents
- [C4 L1: System Context](c4-l1-system-context.md)
- [C4 L2: Container](c4-l2-container-deployment.md)
- [Plan](plan.md)
- [Contracts](../../packages/contracts/src/)
