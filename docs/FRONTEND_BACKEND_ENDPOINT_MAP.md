# Frontend Endpoint to Backend Route Map

تم إنشاء هذا الملف في 2026-04-30 لمراجعة تطابق `website/src/lib/api/config.ts` مع Routes الحالية في Go Fiber داخل `Fiber/internal/routes`.

`API_CONFIG.BASE_URL` و `API_CONFIG.INTERNAL_URL` ينتهيان عادةً بـ `/api`، لذلك كل endpoint في الفرونت أدناه يطابق route كامل بالشكل `/api/...` في الباكند.

## ملخص المخاطر

| الحالة | النطاق | الملاحظة |
| --- | --- | --- |
| مطابق | معظم endpoints في `API_ENDPOINTS` | موجود في Go Fiber بنفس المسار المقصود |
| غير موجود في Go Fiber | 4 endpoints | كلّها ضمن Security Monitor القديمة |
| يحتاج انتباه للـ method | عدة endpoints | المسار موجود لكن يجب استخدام method محدد غير افتراضي |
| متكرر/Alias في الفرونت | تمت إزالة aliases المعروفة | يجب عدم إضافة مفتاحين لنفس endpoint داخل `API_ENDPOINTS` |

## Naming Policy

| النمط | الاستخدام |
| --- | --- |
| `LIST_PUBLIC` / `SHOW_PUBLIC` | Routes العامة مثل `/posts` و `/articles/:id` |
| `LIST` / `SHOW` | Routes لوحة التحكم مثل `/dashboard/categories` |
| `BULK_DELETE` | عمليات bulk، ولا نستخدم `DELETE_BULK` |
| `PERMISSIONS.LIST` | مصدر permissions الوحيد، ولا نضعه داخل `ROLES` |
| `PUBLISH` / `UNPUBLISH` | نشر المقالات، ولا نستخدم `TOGGLE_PUBLISH` |

## Endpoints تحتاج قرار

| Frontend Endpoint | Backend Route | الحالة | الحل المقترح |
| --- | --- | --- | --- |
| `GET /dashboard/security/monitor/alerts` | غير موجود | أزيل من `API_ENDPOINTS` | استخدم `GET /dashboard/security/logs` |
| `GET /dashboard/security/monitor/alerts/:id` | غير موجود | أزيل من `API_ENDPOINTS` | لا يوجد details route حاليًا؛ أضفه في Fiber فقط إذا احتجته |
| `POST /dashboard/security/monitor/run-scan` | غير موجود | أزيل من `API_ENDPOINTS` | أضف handler فعلي قبل إرجاع المفتاح |
| `GET /dashboard/security/monitor/export-report` | غير موجود | أزيل من `API_ENDPOINTS` | أضف export endpoint فعلي قبل إرجاع المفتاح |
| `POST /dashboard/redis/env` | `POST /api/dashboard/redis/env` | موجود | يجب ألا يُستدعى بـ `GET` |
| `GET /dashboard/performance/live` | `GET /api/dashboard/performance/live` | موجود | لا توجد مشكلة في Fiber |
| `POST /front/contact` | `POST /api/front/contact` | موجود | لا توجد مشكلة في Fiber |

## Auth

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `AUTH.REGISTER` | `POST /auth/register` | `POST /api/auth/register` | مطابق |
| `AUTH.LOGIN` | `POST /auth/login` | `POST /api/auth/login` | مطابق |
| `AUTH.LOGOUT` | `POST /auth/logout` | `POST /api/auth/logout` | مطابق |
| `AUTH.ME` | `GET /auth/user` | `GET /api/auth/user` | مطابق |
| `AUTH.FORGOT_PASSWORD` | `POST /auth/password/forgot` | `POST /api/auth/password/forgot` | مطابق |
| `AUTH.RESET_PASSWORD` | `POST /auth/password/reset` | `POST /api/auth/password/reset` | مطابق |
| `AUTH.VERIFY_EMAIL` | `GET /auth/email/verify/:id/:hash` | `GET /api/auth/email/verify/:id/:hash` | مطابق |
| `AUTH.RESEND_VERIFY` | `POST /auth/email/resend` | `POST /api/auth/email/resend` | مطابق |
| `AUTH.GOOGLE_REDIRECT` | `GET /auth/google/redirect` | `GET /api/auth/google/redirect` | مطابق |
| `AUTH.GOOGLE_CALLBACK` | `GET /auth/google/callback` | `GET /api/auth/google/callback` | مطابق |

## Public/Home

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `HOME.INDEX` | `GET /home` | `GET /api/home` | مطابق |
| `HOME.CALENDAR` | `GET /home/calendar` | `GET /api/home/calendar` | مطابق |
| `HOME.EVENT` | `GET /home/event/:id` | `GET /api/home/event/:id` | مطابق |
| `FRONTEND.CLASSES` | `GET /school-classes` | `GET /api/school-classes` | مطابق |
| `FRONTEND.CLASS_DETAILS` | `GET /school-classes/:id` | `GET /api/school-classes/:id` | مطابق |
| `FRONT.SETTINGS` | `GET /front/settings` | `GET /api/front/settings` | مطابق |
| `FRONT.CONTACT` | `POST /front/contact` | `POST /api/front/contact` | مطابق |
| `FILTER.INDEX` | `GET /filter` | `GET /api/filter` | مطابق |
| `FILTER.SUBJECTS_BY_CLASS` | `GET /filter/subjects/:classId` | `GET /api/filter/subjects/:classId` | مطابق |
| `FILTER.SEMESTERS_BY_SUBJECT` | `GET /filter/semesters/:subjectId` | `GET /api/filter/semesters/:subjectId` | مطابق |

## Dashboard Core

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `DASHBOARD.INDEX` | `GET /dashboard` | `GET /api/dashboard` | مطابق |
| `DASHBOARD.ANALYTICS` | `GET /dashboard/visitor-analytics` | `GET /api/dashboard/visitor-analytics` | مطابق |
| `PERFORMANCE.SUMMARY` | `GET /dashboard/performance/summary` | `GET /api/dashboard/performance/summary` | مطابق |
| `PERFORMANCE.LIVE` | `GET /dashboard/performance/live` | `GET /api/dashboard/performance/live` | مطابق |
| `PERFORMANCE.RAW` | `GET /dashboard/performance/raw` | `GET /api/dashboard/performance/raw` | مطابق |
| `PERFORMANCE.RESPONSE_TIME` | `GET /dashboard/performance/response-time` | `GET /api/dashboard/performance/response-time` | مطابق |
| `PERFORMANCE.CACHE` | `GET /dashboard/performance/cache` | `GET /api/dashboard/performance/cache` | مطابق |

## Academic

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `SCHOOL_CLASSES.LIST` | `GET /dashboard/school-classes` | `GET /api/dashboard/school-classes` | مطابق |
| `SCHOOL_CLASSES.SHOW` | `GET /dashboard/school-classes/:id` | `GET /api/dashboard/school-classes/:id` | مطابق |
| `SCHOOL_CLASSES.STORE` | `POST /dashboard/school-classes` | `POST /api/dashboard/school-classes` | مطابق |
| `SCHOOL_CLASSES.UPDATE` | `PUT /dashboard/school-classes/:id` | `PUT /api/dashboard/school-classes/:id` | مطابق |
| `SCHOOL_CLASSES.DELETE` | `DELETE /dashboard/school-classes/:id` | `DELETE /api/dashboard/school-classes/:id` | مطابق |
| `SUBJECTS.LIST` | `GET /dashboard/subjects` | `GET /api/dashboard/subjects` | مطابق |
| `SUBJECTS.SHOW` | `GET /dashboard/subjects/:id` | `GET /api/dashboard/subjects/:id` | مطابق |
| `SUBJECTS.STORE` | `POST /dashboard/subjects` | `POST /api/dashboard/subjects` | مطابق |
| `SUBJECTS.UPDATE` | `PUT /dashboard/subjects/:id` | `PUT /api/dashboard/subjects/:id` | مطابق |
| `SUBJECTS.DELETE` | `DELETE /dashboard/subjects/:id` | `DELETE /api/dashboard/subjects/:id` | مطابق |
| `SEMESTERS.LIST` | `GET /dashboard/semesters` | `GET /api/dashboard/semesters` | مطابق |
| `SEMESTERS.SHOW` | `GET /dashboard/semesters/:id` | `GET /api/dashboard/semesters/:id` | مطابق |
| `SEMESTERS.STORE` | `POST /dashboard/semesters` | `POST /api/dashboard/semesters` | مطابق |
| `SEMESTERS.UPDATE` | `PUT /dashboard/semesters/:id` | `PUT /api/dashboard/semesters/:id` | مطابق |
| `SEMESTERS.DELETE` | `DELETE /dashboard/semesters/:id` | `DELETE /api/dashboard/semesters/:id` | مطابق |

## Users/Roles

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `USERS.LIST` | `GET /dashboard/users` | `GET /api/dashboard/users` | مطابق |
| `USERS.SEARCH` | `GET /dashboard/users/search` | `GET /api/dashboard/users/search` | مطابق |
| `USERS.SHOW` | `GET /dashboard/users/:id` | `GET /api/dashboard/users/:user` | مطابق |
| `USERS.STORE` | `POST /dashboard/users` | `POST /api/dashboard/users` | مطابق |
| `USERS.UPDATE` | `PUT /dashboard/users/:id` | `PUT /api/dashboard/users/:user` | مطابق |
| `USERS.DELETE` | `DELETE /dashboard/users/:id` | `DELETE /api/dashboard/users/:user` | مطابق |
| `USERS.BULK_DELETE` | `POST /dashboard/users/bulk-delete` | `POST /api/dashboard/users/bulk-delete` | مطابق |
| `USERS.UPDATE_STATUS` | `POST /dashboard/users/update-status` | `POST /api/dashboard/users/update-status` | مطابق |
| `USERS.UPDATE_ROLES` | `PUT /dashboard/users/:id/roles-permissions` | `PUT /api/dashboard/users/:user/roles-permissions` | مطابق |
| `ROLES.LIST` | `GET /dashboard/roles` | `GET /api/dashboard/roles` | مطابق |
| `ROLES.SHOW` | `GET /dashboard/roles/:id` | `GET /api/dashboard/roles/:id` | مطابق |
| `ROLES.STORE` | `POST /dashboard/roles` | `POST /api/dashboard/roles` | مطابق |
| `ROLES.UPDATE` | `PUT /dashboard/roles/:id` | `PUT /api/dashboard/roles/:id` | مطابق |
| `ROLES.DELETE` | `DELETE /dashboard/roles/:id` | `DELETE /api/dashboard/roles/:id` | مطابق |
| `PERMISSIONS.LIST` | `GET /dashboard/permissions` | `GET /api/dashboard/permissions` | مطابق |
| `PERMISSIONS.STORE` | `POST /dashboard/permissions` | `POST /api/dashboard/permissions` | مطابق |
| `PERMISSIONS.UPDATE` | `PUT /dashboard/permissions/:id` | `PUT /api/dashboard/permissions/:id` | مطابق |
| `PERMISSIONS.DELETE` | `DELETE /dashboard/permissions/:id` | `DELETE /api/dashboard/permissions/:id` | مطابق |

## Content

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `ARTICLES.LIST_PUBLIC` | `GET /articles` | `GET /api/articles` | مطابق |
| `ARTICLES.SHOW_PUBLIC` | `GET /articles/:id` | `GET /api/articles/:id` | مطابق |
| `ARTICLES.DOWNLOAD` | `GET /articles/file/:id/download` | `GET /api/articles/file/:id/download` | مطابق |
| `ARTICLES.STATS` | `GET /dashboard/articles/stats` | `GET /api/dashboard/articles/stats` | مطابق |
| `ARTICLES.LIST` | `GET /dashboard/articles` | `GET /api/dashboard/articles` | مطابق |
| `ARTICLES.CREATE` | `GET /dashboard/articles/create` | `GET /api/dashboard/articles/create` | مطابق |
| `ARTICLES.SHOW` | `GET /dashboard/articles/:id` | `GET /api/dashboard/articles/:id` | مطابق |
| `ARTICLES.EDIT` | `GET /dashboard/articles/:id/edit` | `GET /api/dashboard/articles/:id/edit` | مطابق |
| `ARTICLES.STORE` | `POST /dashboard/articles` | `POST /api/dashboard/articles` | مطابق |
| `ARTICLES.UPDATE` | `PUT /dashboard/articles/:id` | `PUT /api/dashboard/articles/:id` | مطابق |
| `ARTICLES.DELETE` | `DELETE /dashboard/articles/:id` | `DELETE /api/dashboard/articles/:id` | مطابق |
| `ARTICLES.PUBLISH` | `POST /dashboard/articles/:id/publish` | `POST /api/dashboard/articles/:id/publish` | مطابق |
| `ARTICLES.UNPUBLISH` | `POST /dashboard/articles/:id/unpublish` | `POST /api/dashboard/articles/:id/unpublish` | مطابق |
| `ARTICLES.BY_KEYWORD` | `GET /articles/by-keyword/:keyword` | `GET /api/articles/by-keyword/:keyword` | مطابق |
| `ARTICLES.BY_CLASS` | `GET /articles/by-class/:gradeLevel` | `GET /api/articles/by-class/:grade_level` | مطابق |
| `POSTS.LIST_PUBLIC` | `GET /posts` | `GET /api/posts` | مطابق |
| `POSTS.SHOW_PUBLIC` | `GET /posts/:id` | `GET /api/posts/:id` | مطابق |
| `POSTS.INCREMENT_VIEW` | `POST /posts/:id/increment-view` | `POST /api/posts/:id/increment-view` | مطابق |
| `POSTS.TOGGLE_STATUS` | `POST /dashboard/posts/:id/toggle-status` | `POST /api/dashboard/posts/:id/toggle-status` | مطابق |
| `POSTS.STORE` | `POST /dashboard/posts` | `POST /api/dashboard/posts` | مطابق |
| `POSTS.UPDATE` | `POST /dashboard/posts/:id` | `POST /api/dashboard/posts/:id` | مطابق، ليس `PUT` |
| `POSTS.DELETE` | `DELETE /dashboard/posts/:id` | `DELETE /api/dashboard/posts/:id` | مطابق |
| `KEYWORDS.INDEX` | `GET /keywords` | `GET /api/keywords` | مطابق |
| `KEYWORDS.SHOW` | `GET /keywords/:keyword` | `GET /api/keywords/:keyword` | مطابق |
| `CATEGORIES.LIST_PUBLIC` | `GET /categories` | `GET /api/categories` | مطابق |
| `CATEGORIES.LIST` | `GET /dashboard/categories` | `GET /api/dashboard/categories` | مطابق |
| `CATEGORIES.SHOW` | `GET /dashboard/categories/:id` | `GET /api/dashboard/categories/:id` | مطابق |
| `CATEGORIES.SHOW_PUBLIC` | `GET /categories/:id` | `GET /api/categories/:id` | مطابق |
| `CATEGORIES.STORE` | `POST /dashboard/categories` | `POST /api/dashboard/categories` | مطابق |
| `CATEGORIES.UPDATE` | `POST /dashboard/categories/:id/update` | `POST /api/dashboard/categories/:id/update` | مطابق |
| `CATEGORIES.DELETE` | `DELETE /dashboard/categories/:id` | `DELETE /api/dashboard/categories/:id` | مطابق |
| `CATEGORIES.TOGGLE` | `POST /dashboard/categories/:id/toggle` | `POST /api/dashboard/categories/:id/toggle` | مطابق |

## Files/Comments

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `FILES.LIST` | `GET /dashboard/files` | `GET /api/dashboard/files` | مطابق |
| `FILES.SHOW` | `GET /dashboard/files/:id` | `GET /api/dashboard/files/:id` | مطابق |
| `FILES.INFO` | `GET /files/:id/info` | `GET /api/files/:id/info` | مطابق |
| `FILES.STORE` | `POST /dashboard/files` | `POST /api/dashboard/files` | مطابق |
| `FILES.UPDATE` | `PUT /dashboard/files/:id` | `PUT /api/dashboard/files/:id` | مطابق |
| `FILES.DELETE` | `DELETE /dashboard/files/:id` | `DELETE /api/dashboard/files/:id` | مطابق |
| `FILES.DOWNLOAD` | `GET /dashboard/files/:id/download` | `GET /api/dashboard/files/:id/download` | مطابق |
| `FILES.INCREMENT_VIEW` | `POST /files/:id/increment-view` | `POST /api/files/:id/increment-view` | مطابق |
| `FILES.UPLOAD` | `POST /upload/image` | `POST /api/upload/image` | مطابق، يتطلب Auth |
| `FILES.UPLOAD_FILE` | `POST /upload/file` | `POST /api/upload/file` | مطابق، يتطلب Auth |
| `COMMENTS.LIST_PUBLIC` | `GET /comments/:database` | `GET /api/comments/:database` | مطابق |
| `COMMENTS.LIST_DASHBOARD` | `GET /dashboard/comments/:database` | `GET /api/dashboard/comments/:database` | مطابق |
| `COMMENTS.STORE` | `POST /dashboard/comments/:database` | `POST /api/dashboard/comments/:database` | مطابق |
| `COMMENTS.DELETE` | `DELETE /dashboard/comments/:database/:id` | `DELETE /api/dashboard/comments/:database/:id` | مطابق |

## Communication

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `MESSAGES.INBOX` | `GET /dashboard/messages/inbox` | `GET /api/dashboard/messages/inbox` | مطابق |
| `MESSAGES.SENT` | `GET /dashboard/messages/sent` | `GET /api/dashboard/messages/sent` | مطابق |
| `MESSAGES.DRAFTS` | `GET /dashboard/messages/drafts` | `GET /api/dashboard/messages/drafts` | مطابق |
| `MESSAGES.SEND` | `POST /dashboard/messages/send` | `POST /api/dashboard/messages/send` | مطابق |
| `MESSAGES.SAVE_DRAFT` | `POST /dashboard/messages/draft` | `POST /api/dashboard/messages/draft` | مطابق |
| `MESSAGES.SHOW` | `GET /dashboard/messages/:id` | `GET /api/dashboard/messages/:id` | مطابق |
| `MESSAGES.MARK_READ` | `POST /dashboard/messages/:id/read` | `POST /api/dashboard/messages/:id/read` | مطابق |
| `MESSAGES.TOGGLE_IMPORTANT` | `POST /dashboard/messages/:id/important` | `POST /api/dashboard/messages/:id/important` | مطابق |
| `MESSAGES.DELETE` | `DELETE /dashboard/messages/:id` | `DELETE /api/dashboard/messages/:id` | مطابق |
| `NOTIFICATIONS.LIST` | `GET /dashboard/notifications` | `GET /api/dashboard/notifications` | مطابق |
| `NOTIFICATIONS.LATEST` | `GET /dashboard/notifications/latest` | `GET /api/dashboard/notifications/latest` | مطابق |
| `NOTIFICATIONS.SEND` | `POST /dashboard/notifications` | `POST /api/dashboard/notifications` | مطابق |
| `NOTIFICATIONS.MARK_READ` | `POST /dashboard/notifications/:id/read` | `POST /api/dashboard/notifications/:id/read` | مطابق |
| `NOTIFICATIONS.MARK_ALL_READ` | `POST /dashboard/notifications/read-all` | `POST /api/dashboard/notifications/read-all` | مطابق |
| `NOTIFICATIONS.BULK_ACTION` | `POST /dashboard/notifications/bulk` | `POST /api/dashboard/notifications/bulk` | مطابق |
| `NOTIFICATIONS.DELETE` | `DELETE /dashboard/notifications/:id` | `DELETE /api/dashboard/notifications/:id` | مطابق |
| `CALENDAR.DATABASES` | `GET /dashboard/calendar/databases` | `GET /api/dashboard/calendar/databases` | مطابق |
| `CALENDAR.EVENTS` | `GET /dashboard/calendar/events` | `GET /api/dashboard/calendar/events` | مطابق |
| `CALENDAR.STORE` | `POST /dashboard/calendar/events` | `POST /api/dashboard/calendar/events` | مطابق |
| `CALENDAR.UPDATE` | `PUT /dashboard/calendar/events/:id` | `PUT /api/dashboard/calendar/events/:id` | مطابق |
| `CALENDAR.DELETE` | `DELETE /dashboard/calendar/events/:id` | `DELETE /api/dashboard/calendar/events/:id` | مطابق |

## System

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `SETTINGS.GET_ALL` | `GET /dashboard/settings` | `GET /api/dashboard/settings` | مطابق |
| `SETTINGS.UPDATE` | `POST /dashboard/settings` | `POST /api/dashboard/settings` | مطابق |
| `SETTINGS.TEST_SMTP` | `POST /dashboard/settings/smtp/test` | `POST /api/dashboard/settings/smtp/test` | مطابق |
| `SETTINGS.SEND_TEST_EMAIL` | `POST /dashboard/settings/smtp/send-test` | `POST /api/dashboard/settings/smtp/send-test` | مطابق |
| `SETTINGS.UPDATE_ROBOTS` | `POST /dashboard/settings/robots` | `POST /api/dashboard/settings/robots` | مطابق |
| `SITEMAP.STATUS` | `GET /dashboard/sitemap/status` | `GET /api/dashboard/sitemap/status` | مطابق |
| `SITEMAP.GENERATE_ALL` | `POST /dashboard/sitemap/generate` | `POST /api/dashboard/sitemap/generate` | مطابق |
| `SITEMAP.DELETE` | `DELETE /dashboard/sitemap/delete/:type/:database` | `DELETE /api/dashboard/sitemap/delete/:type/:database` | مطابق |

## Security

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `SECURITY.DASHBOARD` | `GET /dashboard/security/monitor/dashboard` | `GET /api/dashboard/security/monitor/dashboard` | مطابق |
| `SECURITY.LOGS` | `GET /dashboard/security/logs` | `GET /api/dashboard/security/logs` | مطابق |
| `SECURITY.ANALYTICS` | `GET /dashboard/security/analytics` | `GET /api/dashboard/security/analytics` | مطابق |
| `SECURITY.RESOLVE` | `POST /dashboard/security/logs/:id/resolve` | `POST /api/dashboard/security/logs/:id/resolve` | مطابق |
| `SECURITY.DELETE_LOG` | `DELETE /dashboard/security/logs/:id` | `DELETE /api/dashboard/security/logs/:id` | مطابق |
| `SECURITY.DELETE_ALL` | `DELETE /dashboard/security/logs` | `DELETE /api/dashboard/security/logs` | مطابق |
| `SECURITY.IP_DETAILS` | `GET /dashboard/security/ip/:ip` | `GET /api/dashboard/security/ip/:ip` | مطابق |
| `SECURITY.BLOCKED_IPS` | `GET /dashboard/security/blocked-ips` | `GET /api/dashboard/security/blocked-ips` | مطابق |
| `SECURITY.BLOCK_IP` | `POST /dashboard/security/ip/block` | `POST /api/dashboard/security/ip/block` | مطابق |
| `SECURITY.UNBLOCK_IP` | `POST /dashboard/security/ip/unblock` | `POST /api/dashboard/security/ip/unblock` | مطابق |
| `SECURITY.DELETE_BLOCK` | `DELETE /dashboard/security/blocked-ips/:ip` | `DELETE /api/dashboard/security/blocked-ips/:ip` | مطابق |
| `SECURITY.TRUSTED_IPS` | `GET /dashboard/security/trusted-ips` | `GET /api/dashboard/security/trusted-ips` | مطابق |
| `SECURITY.TRUST_IP` | `POST /dashboard/security/ip/trust` | `POST /api/dashboard/security/ip/trust` | مطابق |
| `SECURITY.UNTRUST_IP` | `POST /dashboard/security/ip/untrust` | `POST /api/dashboard/security/ip/untrust` | مطابق |

## Redis

| Frontend Key | Frontend Endpoint | Backend Route | الحالة |
| --- | --- | --- | --- |
| `REDIS.KEYS` | `GET /dashboard/redis/keys` | `GET /api/dashboard/redis/keys` | مطابق |
| `REDIS.INFO` | `GET /dashboard/redis/info` | `GET /api/dashboard/redis/info` | مطابق |
| `REDIS.TEST` | `GET /dashboard/redis/test` | `GET /api/dashboard/redis/test` | مطابق |
| `REDIS.STORE` | `POST /dashboard/redis` | `POST /api/dashboard/redis` | مطابق |
| `REDIS.DELETE` | `DELETE /dashboard/redis/:key` | `DELETE /api/dashboard/redis/:key` | مطابق |
| `REDIS.UPDATE_ENV` | `POST /dashboard/redis/env` | `POST /api/dashboard/redis/env` | مطابق |

## Routes موجودة في Fiber وغير ممثلة في config.ts

| Backend Route | ملاحظة |
| --- | --- |
| `POST /api/auth/refresh` | موجود في Fiber، لا يوجد key مباشر في `API_ENDPOINTS.AUTH` |
| `POST /api/auth/google/token` | موجود في Fiber، لا يوجد key مباشر في `API_ENDPOINTS.AUTH` |
| `PUT /api/auth/profile` | موجود في Fiber، لا يوجد key مباشر في `API_ENDPOINTS.AUTH` |
| `POST /api/auth/account/delete` | موجود في Fiber، لا يوجد key مباشر في `API_ENDPOINTS.AUTH` |
| `POST /api/auth/push-token` | موجود في Fiber، لا يوجد key مباشر في `API_ENDPOINTS.AUTH` |
| `DELETE /api/auth/push-token` | موجود في Fiber، لا يوجد key مباشر في `API_ENDPOINTS.AUTH` |
| `GET /api/user/roles` | مسار user غير dashboard |
| `GET /api/user/roles/:id` | مسار user غير dashboard |
| `GET /api/articles/download` | signed download |
| `GET /api/articles/file/:id/download-url` | token/download-url |
| `POST /api/reactions` | غير ممثل في config |
| `DELETE /api/reactions/:comment_id` | غير ممثل في config |
| `GET /api/reactions/:comment_id` | غير ممثل في config |
| `GET /api/secure/view` | غير ممثل في config |
| `POST /api/ai/generate` | غير ممثل في config |
| `POST /api/dashboard/secure/upload-image` | upload آمن للوحة التحكم |
| `POST /api/dashboard/secure/upload-document` | upload آمن للوحة التحكم |
| `POST /api/dashboard/ai/generate` | AI للوحة التحكم |
| `GET /api/dashboard/content-analytics` | موجود في Fiber، لا يوجد key مباشر |
| `GET /api/dashboard/activities` | موجود في Fiber، لا يوجد key مباشر |
| `DELETE /api/dashboard/activities/clean` | موجود في Fiber، لا يوجد key مباشر |
| `POST /api/dashboard/visitor-analytics/prune` | موجود في Fiber، لا يوجد key مباشر |
| `POST /api/dashboard/notifications/prune` | موجود في Fiber، لا يوجد key مباشر |
| `POST /api/dashboard/messages/save-draft` | Alias backend لـ `POST /dashboard/messages/draft` |
| `POST /api/dashboard/settings/update` | Alias backend لـ `POST /dashboard/settings` |
| `GET /api/dashboard/security/stats` | موجود في Fiber، لا يوجد key مباشر |
| `GET /api/dashboard/security/overview` | موجود في Fiber، لا يوجد key مباشر؛ الفرونت يستخدم monitor/dashboard |
| `GET /api/dashboard/security/analytics/routes` | موجود في Fiber، لا يوجد key مباشر |
| `GET /api/dashboard/security/analytics/geo` | موجود في Fiber، لا يوجد key مباشر |
| `POST /api/dashboard/security/ip/:ip/block` | Alias backend |
| `POST /api/dashboard/security/ip/:ip/unblock` | Alias backend |
| `POST /api/dashboard/security/ip/:ip/trust` | Alias backend |
| `POST /api/dashboard/security/ip/:ip/untrust` | Alias backend |
| `DELETE /api/dashboard/blocked-ips/:ip` | Shortcut backend |
| `DELETE /api/dashboard/trusted-ips/:ip` | Shortcut backend |
| `DELETE /api/dashboard/redis/expired/clean` | موجود في Fiber، لا يوجد key مباشر |
| `GET /api/legal/privacy-policy` | غير ممثل في config |
| `GET /api/legal/terms-of-service` | غير ممثل في config |
| `GET /api/legal/cookie-policy` | غير ممثل في config |
| `GET /api/legal/disclaimer` | غير ممثل في config |
| `POST /api/lang/change` | غير ممثل في config |
| `GET /api/lang/current` | غير ممثل في config |
| `GET /api/grades` | Route توافق قديم |
| `GET /api/grades/subjects/:classId` | Route توافق قديم |
| `GET /api/grades/articles/:id` | Route توافق قديم |
| `GET /api/grades/files/:id/download` | Route توافق قديم |
| `GET /api/grades/:id` | Route توافق قديم |
