// Export all API services
export { default as authService } from './auth';
export { default as dashboardService } from './dashboard';
export { default as articlesService } from './articles';
export type { ArticleFormData, SEOArticle } from './articles';
export { default as usersService } from './users';
export { default as categoriesService } from './categories';
export { default as schoolClassesService } from './school-classes';
export { default as subjectsService } from './subjects';
export { default as semestersService } from './semesters';
export { default as securityService } from './security';
export { notificationService as notificationsService } from './notifications';
export { default as messagesService } from './messages';
export { default as rolesService } from './roles';
export { default as calendarService } from './calendar';
export { default as filesService } from './files';
export { default as postsService } from './posts';
export { default as settingsService } from './settings';
export { commentsService } from './comments';
export { monitorService } from './monitor';
export { contentAuditService } from './content-audit';
export type { PolicyAuditRun, PolicyAuditFinding } from './content-audit';

// Export API client and config
export { apiClient } from '../client';
export { API_ENDPOINTS, API_CONFIG, COUNTRIES } from '../config';
export type { CountryId, CountryCode } from '../config';
