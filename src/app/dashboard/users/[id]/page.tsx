'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { usersService } from '@/lib/api/services';
import { COUNTRIES } from '@/lib/api/config';
import { 
  User, Mail, Phone, Camera, Lock, Save, Calendar, Shield, 
  Briefcase, Globe, Activity, Facebook, Twitter, Linkedin, Instagram, Github,
  ArrowRight
} from 'lucide-react';
import Image from '@/components/common/AppImage';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import { cn, getStorageUrl } from '@/lib/utils';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

const ADMIN_ROLES = ['admin', 'super_admin', 'super-admin', 'manager', 'administrator', 'root'];

function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { isAuthorized, user: currentUser } = usePermissionGuard('users.edit');
  const { id } = use(params);
  const router = useRouter();

  const hasAdminRole = currentUser?.roles?.some(r => {
    const roleName = typeof r === 'string' ? r : r.name;
    return ADMIN_ROLES.includes(roleName?.toLowerCase() ?? '');
  }) || currentUser?.id === 1;

  // Only allow editing yourself OR if you hold an admin role
  const canEditThisUser = isAuthorized && (String(currentUser?.id) === id || hasAdminRole);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'social' | 'security'>('personal');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    job_title: '',
    gender: '',
    country: '',
    password: '',
    password_confirmation: '',
    social_links: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
      github: ''
    }
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      fetchUserData(id);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthorized === false) {
      router.replace('/dashboard/settings');
    }
  }, [isAuthorized, router]);

  if (isAuthorized === null || isAuthorized === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!canEditThisUser) {
    return <AccessDenied />;
  }

  const fetchUserData = async (userId: string) => {
    try {
      setIsLoading(true);
      const userData = await usersService.getById(userId);
      setUser(userData);
      
      // Parse social links if needed
      let socialLinks = { facebook: '', twitter: '', linkedin: '', instagram: '', github: '' };
      if (userData.social_links && !Array.isArray(userData.social_links)) {
        socialLinks = { ...socialLinks, ...userData.social_links };
      }

      const userCountry = (userData as any).country;
      const countryObj = COUNTRIES.find(c => c.id === userCountry || c.code === userCountry || c.name === userCountry);

      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: (userData as any).phone || '',
        bio: (userData as any).bio || '',
        job_title: (userData as any).job_title || '',
        gender: (userData as any).gender || '',
        country: countryObj ? countryObj.id : (userCountry || ''),
        password: '',
        password_confirmation: '',
        social_links: socialLinks
      });

      const profilePhoto = getStorageUrl(
        userData.profile_photo_url || userData.profile_photo_path
      );
      if (profilePhoto) {
        setPreviewImage(profilePhoto);
      }
    } catch (error) {
      console.error('Failed to fetch user data', error);
      setMessage({ type: 'error', text: 'فشل تحميل بيانات المستخدم' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('social_')) {
      const socialKey = name.replace('social_', '');
      setFormData(prev => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [socialKey]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.password && formData.password !== formData.password_confirmation) {
      setMessage({ type: 'error', text: 'كلمة المرور غير متطابقة' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        job_title: formData.job_title,
        gender: formData.gender,
        country: formData.country,
        social_links: formData.social_links
      };

      if (formData.password) {
        updateData.password = formData.password;
        updateData.password_confirmation = formData.password_confirmation;
      }

      if (selectedFile) {
        updateData.profile_photo = selectedFile;
      }

      const updatedUser = await usersService.update(user.id, updateData);
      
      setUser(updatedUser);
      setMessage({ type: 'success', text: 'تم تحديث بيانات المستخدم بنجاح' });
      setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
      setSelectedFile(null);
      
      fetchUserData(String(updatedUser.id));
    } catch (error: any) {
      console.error('Update failed', error);
      const errorMsg = error.response?.data?.message || error.message || 'حدث خطأ أثناء التحديث';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const isUserOnline = (u: any) => {
    if (u?.is_online !== undefined) return u.is_online;
    if (!u?.last_activity) return false;
    const lastActivity = new Date(u.last_activity);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastActivity > fiveMinutesAgo;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/users')}
            className="p-2"
          >
            <ArrowRight size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">تعديل المستخدم</h1>
            <p className="text-muted-foreground mt-1">إدارة بيانات المستخدم {user?.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative group mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl bg-secondary flex items-center justify-center relative">
                    {previewImage ? (
                      <Image
                        src={previewImage} 
                        alt={user?.name} 
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-muted-foreground">
                        {user?.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-background z-10",
                    isUserOnline(user) ? "bg-success" : "bg-muted-foreground"
                  )} title={isUserOnline(user) ? "متصل الآن" : "غير متصل"} />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors cursor-pointer z-20"
                    title="تغيير الصورة"
                  >
                    <Camera size={18} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>

                <h2 className="text-xl font-bold mb-1">{user?.name}</h2>
                <p className="text-sm text-muted-foreground mb-3">{user?.email}</p>

                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <Shield size={12} />
                    <span>{(user as any)?.roles?.[0]?.name || 'مستخدم'}</span>
                  </div>
                  {formData.job_title && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                      <Briefcase size={12} />
                      <span>{formData.job_title}</span>
                    </div>
                  )}
                </div>

                {/* Social Links Quick View */}
                <div className="flex justify-center gap-3 mt-2">
                   {formData.social_links.facebook && isSafeUrl(formData.social_links.facebook) && <a href={formData.social_links.facebook} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-blue-600 transition-colors"><Facebook className="w-4 h-4" /></a>}
                   {formData.social_links.twitter && isSafeUrl(formData.social_links.twitter) && <a href={formData.social_links.twitter} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-sky-500 transition-colors"><Twitter className="w-4 h-4" /></a>}
                   {formData.social_links.linkedin && isSafeUrl(formData.social_links.linkedin) && <a href={formData.social_links.linkedin} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-blue-700 transition-colors"><Linkedin className="w-4 h-4" /></a>}
                   {formData.social_links.instagram && isSafeUrl(formData.social_links.instagram) && <a href={formData.social_links.instagram} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-pink-600 transition-colors"><Instagram className="w-4 h-4" /></a>}
                   {formData.social_links.github && isSafeUrl(formData.social_links.github) && <a href={formData.social_links.github} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-gray-900 transition-colors"><Github className="w-4 h-4" /></a>}
                </div>
              </div>

              <div className="mt-8 space-y-4 border-t border-border pt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar size={16} />
                    تاريخ الانضمام
                  </span>
                  <span className="font-medium" dir="ltr">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '-'}
                      </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Activity size={16} />
                    آخر نشاط
                  </span>
                  <span className="font-medium" dir="ltr">
                        {user?.last_activity ? new Date(user.last_activity).toLocaleDateString('en-GB') : '-'}
                      </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Globe size={16} />
                    الدولة
                  </span>
                  <span className="font-medium">
                    {COUNTRIES.find(c => c.id === formData.country || c.code === formData.country)?.name || formData.country || '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-border pb-0">
               <div className="flex gap-6 overflow-x-auto">
                 <button
                   className={cn(
                     "pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                     activeTab === 'personal' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                   )}
                   onClick={() => setActiveTab('personal')}
                 >
                   البيانات الشخصية
                 </button>
                 <button
                   className={cn(
                     "pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                     activeTab === 'social' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                   )}
                   onClick={() => setActiveTab('social')}
                 >
                   التواصل الاجتماعي
                 </button>
                 <button
                   className={cn(
                     "pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                     activeTab === 'security' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                   )}
                   onClick={() => setActiveTab('security')}
                 >
                   الأمان وكلمة المرور
                 </button>
               </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                  <div className={`p-4 rounded-lg flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                  }`}>
                    {message.type === 'success' ? (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                    {message.text}
                  </div>
                )}

                {/* Personal Info Tab */}
                {activeTab === 'personal' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="الاسم الكامل"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        leftIcon={<User size={18} />}
                        required
                      />
                      <Input
                        label="البريد الإلكتروني"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        leftIcon={<Mail size={18} />}
                        required
                      />
                      <Input
                        label="رقم الهاتف"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        leftIcon={<Phone size={18} />}
                        placeholder="أدخل رقم الهاتف"
                      />
                      <Input
                        label="المسمى الوظيفي"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleChange}
                        leftIcon={<Briefcase size={18} />}
                        placeholder="مثال: مطور برمجيات"
                      />
                      
                      <div>
                        <label className="block text-sm font-medium mb-1.5">الدولة</label>
                        <select
                          name="country"
                          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={formData.country}
                          onChange={handleChange}
                        >
                          <option value="">اختر الدولة...</option>
                          {COUNTRIES.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5">الجنس</label>
                        <select
                          name="gender"
                          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={formData.gender}
                          onChange={handleChange}
                        >
                          <option value="">اختر...</option>
                          <option value="male">ذكر</option>
                          <option value="female">أنثى</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">نبذة تعريفية</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full min-h-[100px] px-3 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm resize-none"
                        rows={3}
                        placeholder="اكتب نبذة قصيرة عن خبراتك ومهاراتك..."
                      />
                    </div>
                  </div>
                )}

                {/* Social Links Tab */}
                {activeTab === 'social' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                     <div className="grid grid-cols-1 gap-4">
                        <div className="relative">
                          <Facebook className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pr-9"
                            placeholder="Facebook URL"
                            label="Facebook"
                            name="social_facebook"
                            value={formData.social_links.facebook}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="relative">
                          <Twitter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pr-9"
                            placeholder="Twitter URL"
                            label="Twitter"
                            name="social_twitter"
                            value={formData.social_links.twitter}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="relative">
                          <Linkedin className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pr-9"
                            placeholder="LinkedIn URL"
                            label="LinkedIn"
                            name="social_linkedin"
                            value={formData.social_links.linkedin}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="relative">
                          <Instagram className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pr-9"
                            placeholder="Instagram URL"
                            label="Instagram"
                            name="social_instagram"
                            value={formData.social_links.instagram}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="relative">
                          <Github className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pr-9"
                            placeholder="GitHub URL"
                            label="GitHub"
                            name="social_github"
                            value={formData.social_links.github}
                            onChange={handleChange}
                          />
                        </div>
                     </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="p-4 bg-yellow-500/10 text-yellow-600 rounded-lg text-sm border border-yellow-500/20">
                      تنبيه: تغيير كلمة المرور سيؤدي إلى تسجيل خروج المستخدم من جميع الأجهزة الأخرى.
                    </div>
                    
                    <Input
                      label="كلمة المرور الجديدة"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      leftIcon={<Lock size={18} />}
                      placeholder="اتركه فارغاً إذا لم ترد التغيير"
                    />
                    <Input
                      label="تأكيد كلمة المرور"
                      name="password_confirmation"
                      type="password"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      leftIcon={<Lock size={18} />}
                      placeholder="أعد كتابة كلمة المرور"
                    />
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    isLoading={isSaving} 
                    className="min-w-[120px]"
                    leftIcon={<Save size={18} />}
                  >
                    حفظ التغييرات
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
