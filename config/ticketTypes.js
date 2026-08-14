'use strict';

/**
 * Vyro Management System - Ticket Types Configuration
 * إعدادات أنواع التذاكر - يمكن تعديل هذا الملف بسهولة
 */

const ticketTypes = [
  {
    id: 'technical_support',
    nameAr: 'الدعم التقني',
    nameEn: 'Technical Support',
    descriptionAr: 'مشاكل تقنية وأعطال',
    emoji: '🔧',
    categoryIdOverride: null,      // overrides TICKET_CATEGORY_ID if set
    supportRoleOverride: null,     // overrides SUPPORT_ROLE_ID if set
    allowMultiple: false,
    modalQuestions: [
      { id: 'subject', label: 'الموضوع / Subject', style: 'SHORT', required: true, maxLength: 100 },
      { id: 'description', label: 'وصف المشكلة / Problem Description', style: 'PARAGRAPH', required: true, maxLength: 1000 },
      { id: 'extra', label: 'نظام التشغيل / Platform or OS', style: 'SHORT', required: false, maxLength: 100 },
    ],
  },
  {
    id: 'general_support',
    nameAr: 'الدعم العام',
    nameEn: 'General Support',
    descriptionAr: 'استفسارات عامة ومساعدة',
    emoji: '💬',
    categoryIdOverride: null,
    supportRoleOverride: null,
    allowMultiple: false,
    modalQuestions: [
      { id: 'subject', label: 'الموضوع / Subject', style: 'SHORT', required: true, maxLength: 100 },
      { id: 'description', label: 'تفاصيل الطلب / Request Details', style: 'PARAGRAPH', required: true, maxLength: 1000 },
    ],
  },
  {
    id: 'complaint',
    nameAr: 'شكوى',
    nameEn: 'Complaint',
    descriptionAr: 'تقديم شكوى ضد عضو أو موظف',
    emoji: '📣',
    categoryIdOverride: null,
    supportRoleOverride: null,
    allowMultiple: true,
    modalQuestions: [
      { id: 'subject', label: 'موضوع الشكوى / Complaint Subject', style: 'SHORT', required: true, maxLength: 100 },
      { id: 'description', label: 'تفاصيل الشكوى / Complaint Details', style: 'PARAGRAPH', required: true, maxLength: 1000 },
      { id: 'extra', label: 'اسم المشتكى عليه / Reported User', style: 'SHORT', required: false, maxLength: 100 },
    ],
  },
  {
    id: 'purchase',
    nameAr: 'شراء / طلب',
    nameEn: 'Purchase',
    descriptionAr: 'طلبات الشراء والخدمات المدفوعة',
    emoji: '💳',
    categoryIdOverride: null,
    supportRoleOverride: null,
    allowMultiple: false,
    modalQuestions: [
      { id: 'subject', label: 'الخدمة المطلوبة / Requested Service', style: 'SHORT', required: true, maxLength: 100 },
      { id: 'description', label: 'تفاصيل الطلب / Order Details', style: 'PARAGRAPH', required: true, maxLength: 1000 },
      { id: 'extra', label: 'طريقة الدفع المفضلة / Preferred Payment', style: 'SHORT', required: false, maxLength: 100 },
    ],
  },
  {
    id: 'staff_application',
    nameAr: 'طلب وظيفة',
    nameEn: 'Staff Application',
    descriptionAr: 'التقدم للانضمام إلى الفريق',
    emoji: '📋',
    categoryIdOverride: null,
    supportRoleOverride: null,
    allowMultiple: false,
    modalQuestions: [
      { id: 'subject', label: 'المنصب المطلوب / Desired Position', style: 'SHORT', required: true, maxLength: 100 },
      { id: 'description', label: 'لماذا تريد الانضمام؟ / Why join us?', style: 'PARAGRAPH', required: true, maxLength: 1000 },
      { id: 'extra', label: 'خبرتك السابقة / Previous Experience', style: 'PARAGRAPH', required: false, maxLength: 500 },
    ],
  },
  {
    id: 'management_contact',
    nameAr: 'التواصل مع الإدارة',
    nameEn: 'Management Contact',
    descriptionAr: 'تواصل مباشر مع الإدارة العليا',
    emoji: '👔',
    categoryIdOverride: null,
    supportRoleOverride: null,
    allowMultiple: false,
    modalQuestions: [
      { id: 'subject', label: 'موضوع التواصل / Contact Subject', style: 'SHORT', required: true, maxLength: 100 },
      { id: 'description', label: 'رسالتك / Your Message', style: 'PARAGRAPH', required: true, maxLength: 1000 },
    ],
  },
  {
    id: 'partnership',
    nameAr: 'طلب شراكة',
    nameEn: 'Partnership Request',
    descriptionAr: 'التعاون والشراكات مع السيرفر',
    emoji: '🤝',
    categoryIdOverride: null,
    supportRoleOverride: null,
    allowMultiple: false,
    modalQuestions: [
      { id: 'subject', label: 'اسم الشريك / Partner Name', style: 'SHORT', required: true, maxLength: 100 },
      { id: 'description', label: 'تفاصيل الشراكة / Partnership Details', style: 'PARAGRAPH', required: true, maxLength: 1000 },
      { id: 'extra', label: 'رابط السيرفر / Server Link', style: 'SHORT', required: false, maxLength: 200 },
    ],
  },
];

module.exports = ticketTypes;
