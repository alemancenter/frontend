'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from '@/components/common/AppImage';
import {
  Mail,
  Send,
  FileText,
  Trash2,
  Star,
  Search,
  Plus,
  Inbox,
  X,
  Loader2,
  ArrowRight
} from 'lucide-react';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { cn, getStorageUrl } from '@/lib/utils';
import type { Message, User, PaginatedResponse } from '@/types';
import { messagesService, usersService } from '@/lib/api/services';
import { toast } from 'react-hot-toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

type TabType = 'inbox' | 'sent' | 'drafts';

// Helper for avatars
const getAvatarUrl = (user: User | undefined) => {
  if (!user) return `https://api.dicebear.com/7.x/avataaars/svg?seed=unknown`;
  const photo = getStorageUrl(user.profile_photo_url || user.profile_photo_path);
  if (photo) return photo;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || String(user.id))}`;
};

export default function MessagesPage() {
  const { isAuthorized } = usePermissionGuard('manage messages');
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  // Delete Confirmation State
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Compose Modal State
  const [composeModal, setComposeModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeData, setComposeData] = useState({
    recipient_id: 0,
    subject: '',
    body: ''
  });
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  
  // User Search State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Messages
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      let response: PaginatedResponse<Message>;
      
      switch (activeTab) {
        case 'inbox':
          response = await messagesService.getInbox();
          break;
        case 'sent':
          response = await messagesService.getSent();
          break;
        case 'drafts':
          response = await messagesService.getDrafts();
          break;
        default:
          return;
      }

      setMessages(response.data ?? []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchMessages();
  }, [fetchMessages, isAuthorized]);



  // Search Users
  useEffect(() => {
    const searchUsers = async () => {
      if (!userSearchQuery.trim()) {
        setUserSearchResults([]);
        return;
      }
      
      setUserSearchLoading(true);
      try {
        const results = await usersService.search(userSearchQuery);
        setUserSearchResults(results);
        setShowUserDropdown(true);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setUserSearchLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Handle outside click for user search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendMessage = async () => {
    if (!composeData.recipient_id) {
      toast.error('الرجاء اختيار المستلم');
      return;
    }
    if (!composeData.subject.trim()) {
      toast.error('الرجاء كتابة عنوان للرسالة');
      return;
    }
    if (!composeData.body.trim()) {
      toast.error('الرجاء كتابة محتوى الرسالة');
      return;
    }

    setSending(true);
    try {
      await messagesService.send({
        recipient_id: composeData.recipient_id,
        subject: composeData.subject,
        body: composeData.body
      });
      toast.success('تم إرسال الرسالة بنجاح');
      setComposeModal(false);
      resetComposeForm();
      if (activeTab === 'sent') fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('فشل في إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const resetComposeForm = () => {
    setComposeData({ recipient_id: 0, subject: '', body: '' });
    setSelectedRecipient(null);
    setUserSearchQuery('');
  };

  const handleReadMessage = async (message: Message) => {
    setSelectedMessage(message);
    
    if (!message.read && activeTab === 'inbox') {
      try {
        // Optimistic update
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, read: true } : m
        ));
        
        await messagesService.markAsRead(message.id);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleStarMessage = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m.id === id ? { ...m, is_important: !m.is_important } : m
      ));
      
      await messagesService.toggleImportant(id);
    } catch (error) {
      console.error('Failed to toggle star:', error);
      toast.error('فشل في تحديث حالة الرسالة');
      fetchMessages();
    }
  };

  const handleDeleteMessage = (e: React.MouseEvent | null, id: number) => {
    if (e) e.stopPropagation();
    setMessageToDelete(id);
  };

  const executeDelete = async () => {
    if (!messageToDelete) return;
    
    setIsDeleting(true);
    try {
      await messagesService.delete(messageToDelete);
      
      // Update UI
      setMessages(prev => prev.filter(m => m.id !== messageToDelete));
      if (selectedMessage?.id === messageToDelete) setSelectedMessage(null);
      
      toast.success('تم حذف الرسالة');
      setMessageToDelete(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('فشل في حذف الرسالة');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (!debouncedSearch) return true;
    const term = debouncedSearch.toLowerCase();
    const otherParty = activeTab === 'sent' ? m.recipient : m.sender;
    return (
      m.subject.toLowerCase().includes(term) ||
      m.body.toLowerCase().includes(term) ||
      otherParty?.name.toLowerCase().includes(term)
    );
  });

  // Permission check after all hooks
  if (isAuthorized === false) {
    return <AccessDenied />;
  }

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الرسائل</h1>
          <p className="text-muted-foreground">إدارة الرسائل والمراسلات</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setComposeModal(true)}>
          رسالة جديدة
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="py-2 space-y-1">
              <button
                onClick={() => { setActiveTab('inbox'); setSelectedMessage(null); }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors',
                  activeTab === 'inbox' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-5 h-5" />
                  <span className="font-medium">الوارد</span>
                </div>
                {/* We don't have global unread count easily available without extra API call, so maybe hide it or use local if accurate enough */}
              </button>
              
              <button
                onClick={() => { setActiveTab('sent'); setSelectedMessage(null); }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors',
                  activeTab === 'sent' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5" />
                  <span className="font-medium">المرسل</span>
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('drafts'); setSelectedMessage(null); }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors',
                  activeTab === 'drafts' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">المسودات</span>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Message List / Content */}
        <div className="lg:col-span-9">
          <Card className="min-h-[600px] flex flex-col">
            {!selectedMessage ? (
              <>
                <div className="p-4 border-b flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      className="pr-9" 
                      placeholder="بحث في الرسائل..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Mail className="w-12 h-12 mb-2 opacity-20" />
                      <p>لا توجد رسائل</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredMessages.map((message) => {
                        const otherParty = activeTab === 'sent' ? message.recipient : message.sender;
                        return (
                          <div
                            key={message.id}
                            onClick={() => handleReadMessage(message)}
                            className={cn(
                              "p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-start gap-4",
                              !message.read && activeTab === 'inbox' ? "bg-primary/5" : ""
                            )}
                          >
                            <Image
                              src={getAvatarUrl(otherParty)}
                              alt={otherParty?.name || 'User'}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn("font-medium", !message.read && activeTab === 'inbox' ? "text-foreground" : "text-muted-foreground")}>
                                  {otherParty?.name || 'مستخدم غير معروف'}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {message.created_at ? new Date(message.created_at).toLocaleDateString('ar-SA') : ''}
                                </span>
                              </div>
                              <h4 className={cn("text-sm mb-1 truncate", !message.read && activeTab === 'inbox' ? "font-semibold" : "font-normal")}>
                                {message.subject}
                              </h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {message.body}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={(e) => handleStarMessage(e, message.id)}
                                className={cn("p-1 rounded-full hover:bg-muted", message.is_important ? "text-yellow-500" : "text-muted-foreground")}
                              >
                                <Star className={cn("w-4 h-4", message.is_important && "fill-current")} />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteMessage(e, message.id)}
                                className="p-1 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Message Detail View
              <div className="flex flex-col h-full">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)}>
                      <ArrowRight className="w-4 h-4 ml-2" />
                      عودة
                    </Button>
                    <div className="h-6 w-px bg-border mx-2" />
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteMessage(null, selectedMessage.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleStarMessage(e, selectedMessage.id)}>
                      <Star className={cn("w-4 h-4", selectedMessage.is_important ? "text-yellow-500 fill-current" : "")} />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString('ar-SA') : ''}
                  </span>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <Image
                      src={getAvatarUrl(activeTab === 'sent' ? selectedMessage.recipient : selectedMessage.sender)}
                      alt="Avatar"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {activeTab === 'sent' 
                          ? `إلى: ${selectedMessage.recipient?.name || 'مستخدم غير معروف'}`
                          : `من: ${selectedMessage.sender?.name || 'مستخدم غير معروف'}`
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedMessage.sender?.email}</p>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold mb-4">{selectedMessage.subject}</h2>
                  
                  <div className="prose max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Compose Modal */}
      <Modal
        isOpen={composeModal}
        onClose={() => setComposeModal(false)}
        title="رسالة جديدة"
        size="lg"
      >
        <div className="space-y-4">
          <div className="space-y-2 relative" ref={searchWrapperRef}>
            <label className="text-sm font-medium">إلى</label>
            {selectedRecipient ? (
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <Image src={getAvatarUrl(selectedRecipient)} alt="" width={24} height={24} className="w-6 h-6 rounded-full" />
                  <span>{selectedRecipient.name}</span>
                  <span className="text-muted-foreground text-sm">({selectedRecipient.email})</span>
                </div>
                <button onClick={() => { setSelectedRecipient(null); setComposeData(d => ({ ...d, recipient_id: 0 })); }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pr-9"
                  placeholder="ابحث عن مستخدم..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  onFocus={() => setShowUserDropdown(true)}
                />
                {showUserDropdown && (userSearchResults.length > 0 || userSearchLoading) && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {userSearchLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">جاري البحث...</div>
                    ) : (
                      userSearchResults.map(user => (
                        <button
                          key={user.id}
                          className="w-full text-right px-4 py-2 hover:bg-muted flex items-center gap-3"
                          onClick={() => {
                            setSelectedRecipient(user);
                            setComposeData(d => ({ ...d, recipient_id: user.id }));
                            setShowUserDropdown(false);
                            setUserSearchQuery('');
                          }}
                        >
                          <Image src={getAvatarUrl(user)} alt="" width={32} height={32} className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <Input
            label="الموضوع"
            value={composeData.subject}
            onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
            placeholder="موضوع الرسالة"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">نص الرسالة</label>
            <textarea
              className="w-full min-h-[200px] p-3 rounded-md border bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="اكتب رسالتك هنا..."
              value={composeData.body}
              onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setComposeModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSendMessage} isLoading={sending} leftIcon={<Send className="w-4 h-4" />}>
              إرسال
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onConfirm={executeDelete}
        title="حذف الرسالة"
        message="هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
