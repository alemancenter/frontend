// ===== Base Types =====
export interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  meta?: PaginationMeta;
  success?: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ===== Auth Types =====
export interface User {
  id: number;
  name: string;
  email: string;
  profile_photo_path?: string;
  profile_photo_url?: string;
  google_id?: string;
  phone?: string;
  bio?: string;
  job_title?: string;
  gender?: string;
  country?: string;
  twitter_handle?: string;
  social_links?: Record<string, string> | any[];
  roles?: Role[];
  permissions?: Permission[];
  email_verified_at?: string;
  last_activity?: string;
  last_seen?: string;
  status?: string; // Account status (active, inactive, etc.)
  is_online?: boolean; // Computed online status
  last_login_ip?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  status: boolean;
  message: string;
  token: string;
  user: User;
}

// ===== Role & Permission Types =====
export interface Role {
  id: number;
  name: string;
  guard_name?: string;
  permissions?: Permission[];
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: number;
  name: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
}

// ===== Article Types =====
export interface Article {
  id: number;
  title: string;
  slug?: string;
  content: string;
  image?: string;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  country_id?: string | number;
  grade_level: number;
  subject_id: number;
  category_id?: number;
  category?: Category;
  user_id?: number;
  user?: User;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  is_published?: boolean;
  published_at?: string;
  views?: number;
  visit_count?: number;
  downloads?: number;
  created_at: string;
  updated_at: string;
  // Additional properties used in edit forms
  files?: any[];
  class_id?: number;
  semester_id?: number;
  keywords?: string | any[];
  file_category?: string;
  file_name?: string;
  status?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  icon_url?: string;
  image?: string;
  image_url?: string;
  icon_image?: string;
  icon_image_url?: string;
  is_active?: boolean;
  country?: string;
  depth?: number;
  parent_id?: number;
  parent?: {
    id: number;
    name: string;
  };
  news_count?: number;
  children?: Category[];
}

export interface SchoolClass {
  id: number;
  grade_name: string;
  grade_level: number;
  subjects?: Subject[];
  semesters?: Semester[];
  created_at?: string;
  updated_at?: string;
}

// ===== Subject Types =====
export interface Subject {
  id: number;
  subject_name: string;
  grade_level: number;
  schoolClass?: SchoolClass;
  articles_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ===== Semester Types =====
export interface Semester {
  id: number;
  semester_name: string;
  grade_level: number;
  class_id?: number;
  school_class_id?: number;
  schoolClass?: SchoolClass;
  articles_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ===== Keyword Types =====
export interface Keyword {
  id: number;
  keyword: string;
  articles_count?: number;
}

// ===== Post Types =====
export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  image?: string;
  image_url?: string;
  meta_description?: string;
  keywords?: string;
  category_id: number;
  author_id?: number;
  is_active: boolean;
  is_featured: boolean;
  country?: string;
  category?: Category;
  author?: User;
  attachments?: FileItem[];
  files?: FileItem[];
  views?: number;
  views_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ===== File Types =====
export interface FileItem {
  id: number;
  file_name: string;
  file_path: string;
  file_url?: string;
  file_type: string;
  file_category: string;
  file_size?: number;
  mime_type?: string;
  article_id?: number;
  post_id?: number;
  article?: Article;
  download_count?: number;
  views_count?: number;
  created_at?: string;
  updated_at?: string;
}

// Alias for FileItem
export type FileAttachment = FileItem;

// ===== Message Types =====
export interface Message {
  id: number;
  subject: string;
  body: string;
  sender_id: number;
  conversation_id: number;
  is_chat: boolean;
  is_draft: boolean;
  is_important?: boolean;
  read: boolean;
  sender?: User;
  recipient?: User;
  conversation?: Conversation;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: number;
  user1_id: number;
  user2_id: number;
  user1?: User;
  user2?: User;
  hasUser?: (userId: number) => boolean;
}

// ===== Notification Types =====
export interface Notification {
  id: string;
  type: string;
  data: {
    title?: string;
    message?: string;
    url?: string;
    [key: string]: any;
  };
  read_at?: string | null;
  created_at: string;
}

// ===== Calendar Event Types =====
export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  start?: string;
  allDay?: boolean;
  extendedProps?: {
    description?: string;
    database?: string;
  };
  created_at?: string;
  updated_at?: string;
}

// ===== Security Types =====
export interface SecurityLog {
  id: number;
  ip_address: string;
  user_agent?: string;
  event_type: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  description?: string;
  risk_score?: number;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: number;
  resolution_notes?: string;
  user_id?: number;
  user?: User;
  event_type_color?: string;
  created_at: string;
  updated_at?: string;
}

export interface SecurityStats {
  total_events: number;
  unresolved_events: number;
  high_risk_events: number;
  blocked_ips: number;
  security_score?: number;
}

export interface SecurityAnalytics {
  security_score: number;
  event_distribution: {
    event_type: string;
    count: number;
  }[];
}

// ===== Dashboard Types =====
export interface DashboardData {
  totals: {
    articles: number;
    news: number;
    users: number;
    online_users: number;
  };
  trends: {
    articles: TrendData;
    news: TrendData;
    users: TrendData;
  };
  analytics: AnalyticsData;
  onlineUsers: OnlineUser[];
  recentActivities: RecentActivity[];
}

export interface TrendData {
  percentage: number;
  trend: 'up' | 'down';
}

export interface AnalyticsData {
  dates: string[];
  articles: number[];
  news: number[];
  comments: number[];
  views: number[];
  authors: number[];
}

export interface ActiveVisitor {
  ip: string;
  country: string;
  city: string;
  browser: string;
  os: string;
  user_agent: string;
  current_page: string;
  current_page_full: string;
  is_member: boolean;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  last_active: string;
  session_start: string;
  history?: Array<{
    url: string;
    time: string;
    device: string;
    location: string;
  }>;
}

export interface VisitorAnalyticsData {
  visitor_stats: {
    current: number;
    current_members: number;
    current_guests: number;
    total_today: number;
    total_combined_today: number;
    change: number;
    history: any;
    active_visitors: ActiveVisitor[];
  };
  user_stats: {
    total: number;
    active: number;
    new_today: number;
  };
  country_stats: Array<{ country: string; count: number }>;
  chart_data: Array<{
    name: string;
    full_date: string;
    visitors: number;
    pageViews: number;
  }>;
  device_stats: Array<{
    name: string;
    value: number;
    count: number;
    color: string;
  }>;
  traffic_sources: Array<{
    source: string;
    visits: number;
    change: number;
  }>;
}

export interface OnlineUser {
  id: number;
  name: string;
  profile_photo_path?: string;
  last_activity?: string;
  last_seen?: string;
  status: 'online' | 'away' | 'offline';
}

export interface RecentActivity {
  type: 'article' | 'news' | 'comment';
  title?: string;
  body?: string;
  created_at: string;
  author?: {
    name: string;
    avatar?: string;
  };
  user?: {
    name: string;
    avatar?: string;
  };
  url?: string;
}

// ===== Settings Types =====
export interface Settings {
  site_name?: string;
  site_description?: string;
  site_language?: string;
  logo?: string;
  favicon?: string;
  adsense_client?: string;
  google_ads_header?: string;
  google_ads_sidebar?: string;
  google_ads_content?: string;
  [key: string]: any;
}

// ===== News Types =====
export interface News {
  id: number;
  title: string;
  slug: string;
  content: string;
  image?: string;
  views?: number;
  author_id?: number;
  category_id?: number;
  author?: User;
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

// ===== Comment Types =====
export interface Comment {
  id: number;
  body: string;
  user_id: number;
  commentable_type: string;
  commentable_id: number;
  user?: User;
  created_at?: string;
  updated_at?: string;
}

// ===== Performance Types =====
export interface PerformanceSummary {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime: string;
  requests_per_minute: number;
  average_response_time: number;
}

// ===== Filter Types =====
export interface FilterData {
  classes: SchoolClass[];
  subjects: Subject[];
  semesters: Semester[];
}

// ===== UI Types =====
export interface NavItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  permission?: string;
}

export interface Stat {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ReactNode;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

// ===== Table Types =====
export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  onPageChange?: (page: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}
