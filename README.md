# Vyro Management System 🔷
## نظام إدارة Vyro للسيرفرات

> نظام بوت ديسكورد متكامل لإدارة السيرفرات — تذاكر، إشراف، ترحيب، وردود تلقائية

---

## 🚀 البدء السريع / Quick Start

### 1. إنشاء تطبيق ديسكورد / Create a Discord Application

1. اذهب إلى [Discord Developer Portal](https://discord.com/developers/applications)
2. اضغط **New Application** → أدخل اسم البوت `Vyro Management System`
3. اذهب إلى قسم **Bot** → اضغط **Add Bot**
4. **انسخ التوكن / Copy Token** (احتفظ به سرياً!)
5. فعّل هذه الصلاحيات تحت **Privileged Gateway Intents**:
   - ✅ PRESENCE INTENT
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT

### 2. دعوة البوت / Invite the Bot

في قسم **OAuth2 → URL Generator**:
- Scopes: `bot`, `applications.commands`
- Bot Permissions:
  - Manage Channels, Manage Roles, Kick Members, Ban Members
  - Moderate Members, Manage Messages, Read Message History
  - Send Messages, Embed Links, Attach Files, Use Slash Commands
  - View Channels, Read Message History

انسخ الرابط وافتحه لدعوة البوت.

### 3. تفعيل وضع المطور / Enable Developer Mode

**Discord Settings → Advanced → Developer Mode ✅**

ثم يمكنك نسخ أي ID بالضغط بزر الماوس الأيمن.

---

## 🔑 الأسرار المطلوبة / Required Secrets

أضف هذه الأسرار في **Replit → Tools → Secrets**:

| الاسم | الوصف | مطلوب؟ |
|-------|-------|---------|
| `DISCORD_TOKEN` | توكن البوت من Developer Portal | ✅ مطلوب |
| `CLIENT_ID` | معرف التطبيق (Application ID) | ✅ مطلوب |
| `DATABASE_URL` | رابط قاعدة البيانات (يُضاف تلقائياً) | ✅ تلقائي |
| `GUILD_ID` | معرف سيرفرك | ⭐ موصى به |
| `OWNER_ID` | معرفك الشخصي | ⭐ موصى به |
| `ADMIN_ROLE_ID` | معرف دور المدير | ⭐ موصى به |
| `MANAGEMENT_ROLE_ID` | معرف دور الإدارة | ⭐ موصى به |
| `SUPPORT_ROLE_ID` | معرف دور الدعم | ⭐ موصى به |
| `MODERATOR_ROLE_ID` | معرف دور المشرف | ⭐ موصى به |
| `TICKET_CATEGORY_ID` | معرف فئة التذاكر المفتوحة | 🔧 اختياري |
| `CLOSED_TICKET_CATEGORY_ID` | معرف فئة التذاكر المغلقة | 🔧 اختياري |
| `REVIEW_TICKET_CATEGORY_ID` | معرف فئة التذاكر قيد المراجعة | 🔧 اختياري |
| `LOG_CHANNEL_ID` | معرف قناة السجلات | 🔧 اختياري |
| `MOD_LOG_CHANNEL_ID` | معرف قناة سجلات الإشراف | 🔧 اختياري |
| `TRANSCRIPT_CHANNEL_ID` | معرف قناة نسخ التذاكر | 🔧 اختياري |
| `WELCOME_CHANNEL_ID` | معرف قناة الترحيب | 🔧 اختياري |
| `GOODBYE_CHANNEL_ID` | معرف قناة الوداع | 🔧 اختياري |
| `TWITCH_URL` | رابط تويتش (للحالة) | 🔧 اختياري |
| `BOT_STATUS_TEXT` | نص الحالة | 🔧 اختياري |
| `COMMAND_SCOPE` | `guild` للتطوير، `global` للإنتاج | 🔧 اختياري |

---

## ▶️ تشغيل البوت / Running the Bot

```bash
npm start
```

يقوم البوت بـ:
1. التحقق من متغيرات البيئة
2. تشغيل خادم Express للـ health check
3. الاتصال بقاعدة البيانات PostgreSQL
4. تشغيل الـ migrations
5. تسجيل أوامر Slash
6. الاتصال بـ Discord

---

## 🎫 نظام التذاكر / Ticket System

### إعداد لوحة التذاكر
```
/ticket-panel
```
انشر لوحة التذاكر في أي قناة. يختار المستخدمون نوع التذكرة من القائمة.

### أوامر التذاكر

| الأمر | الوصف | المطلوب |
|-------|-------|---------|
| `/claim` | استلام التذكرة | موظف |
| `/unclaim` | إلغاء الاستلام | موظف مُستلِم |
| `/review` | تحويل للمراجعة | موظف |
| `/review-end` | إنهاء المراجعة | إدارة |
| `/transfer staff:@user` | تحويل لموظف آخر | موظف مُستلِم |
| `/add user:@user` | إضافة شخص للتذكرة | موظف |
| `/remove user:@user` | إزالة شخص | موظف |
| `/close` | إغلاق التذكرة | صاحب التذكرة/موظف |
| `/reopen` | إعادة الفتح | موظف |
| `/delete` | حذف نهائي مع نسخة | إدارة |
| `/rename name:...` | إعادة التسمية | موظف |
| `/priority level:high` | تغيير الأولوية | موظف |
| `/transcript` | إنشاء نسخة HTML | موظف |
| `/ticket-info` | معلومات التذكرة | موظف |

---

## 🔨 الإشراف / Moderation

| الأمر | الوصف |
|-------|-------|
| `/warn @user reason:...` | إنذار عضو |
| `/warnings @user` | عرض إنذارات عضو |
| `/remove-warning id:5` | حذف إنذار محدد |
| `/clear-warnings @user` | مسح جميع الإنذارات |
| `/timeout @user duration:1h` | إسكات مؤقت |
| `/untimeout @user` | رفع الإسكات |
| `/kick @user` | طرد عضو |
| `/ban @user` | حظر عضو |
| `/unban userid:123456` | رفع الحظر |
| `/clear amount:10` | مسح رسائل |
| `/slowmode seconds:5` | وضع التأخير |
| `/lock` | قفل القناة |
| `/unlock` | فتح القناة |

---

## ⚙️ الإعدادات / Configuration

### رسائل الترحيب
```
/welcome-config enable
/welcome-config channel #welcome
/welcome-config title مرحباً بك في Vyro!
/welcome-config description مرحباً {user} في {server}! عدد الأعضاء: {memberCount}
/welcome-config autorole @Member
/welcome-config preview
```

المتغيرات المدعومة: `{user}` `{username}` `{server}` `{memberCount}` `{accountCreated}`

### الردود التلقائية
```
/autoreply-add trigger:مرحبا response:أهلاً بك! matchtype:contains
/autoreply-list
/autoreply-toggle id:1
/autoreply-remove id:1
```

---

## 🌐 نشر البوت / Deployment (Reserved VM)

لإبقاء البوت يعمل دائماً بعد الإغلاق:

1. في Replit، اضغط **Deploy** → **Reserved VM**
2. اختر أصغر حجم (512MB RAM كافٍ للبدء)
3. Build command: `npm install`
4. Run command: `npm start`
5. Health check path: `/health`
6. تأكد من إضافة جميع الأسرار في بيئة النشر

---

## 🔧 استكشاف الأخطاء / Troubleshooting

### البوت لا يستجيب للأوامر
- تأكد من تفعيل **MESSAGE CONTENT INTENT** و **SERVER MEMBERS INTENT**
- تأكد من صحة `CLIENT_ID` و `GUILD_ID`
- انتظر 5 دقائق بعد تسجيل الأوامر لأول مرة

### خطأ في قاعدة البيانات
- تأكد من إضافة `DATABASE_URL` في Replit Secrets
- أو أضف PostgreSQL Database من Replit (Tools → Database)

### البوت لا يظهر أونلاين
- تأكد من صحة `DISCORD_TOKEN`
- تحقق من سجلات التشغيل في Replit Console

### الأزرار لا تعمل بعد إعادة التشغيل
- هذا طبيعي إذا تغير `index.js` — الأزرار تُجلب من قاعدة البيانات تلقائياً
- تأكد من أن `DATABASE_URL` صحيح

---

## 📝 ترخيص / License

MIT License — Vyro Management System © 2024
