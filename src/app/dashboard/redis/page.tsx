'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Search,
  Activity,
  HardDrive,
  Clock
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { redisService, RedisKey, RedisInfo, RedisInfoSection, RedisTTLFilter } from '@/lib/api/services/redis';
import { toast } from 'react-hot-toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

const REDIS_KEYS_PER_PAGE = 25;

export default function RedisPage() {
  const { isAuthorized } = usePermissionGuard('manage redis');
  const [activeTab, setActiveTab] = useState<'keys' | 'info' | 'settings'>('keys');
  const [keys, setKeys] = useState<RedisKey[]>([]);
  const [info, setInfo] = useState<RedisInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [ttlFilter, setTtlFilter] = useState<RedisTTLFilter>('all');
  const [keysPage, setKeysPage] = useState(1);
  const [keysPagination, setKeysPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: REDIS_KEYS_PER_PAGE,
    total: 0,
    from: 0,
    to: 0,
  });
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ key: '', value: '', ttl: '3600', persist: false });

  // Settings state
  const [envSettings, setEnvSettings] = useState({
    REDIS_HOST: '',
    REDIS_PORT: '',
    REDIS_PASSWORD: '',
    REDIS_DB: '',
  });

  // Define functions before useEffect
  const fetchKeys = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await redisService.getKeys(appliedSearch, page, REDIS_KEYS_PER_PAGE, ttlFilter);
      setKeys(res?.data || []);
      setKeysPage(res.current_page);
      setKeysPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        per_page: res.per_page,
        total: res.total,
        from: res.from,
        to: res.to,
      });
    } catch {
      toast.error('Failed to fetch Redis keys');
      setKeys([]);
      setKeysPagination({
        current_page: 1,
        last_page: 1,
        per_page: REDIS_KEYS_PER_PAGE,
        total: 0,
        from: 0,
        to: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, ttlFilter]);

  const fetchInfo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await redisService.getInfo();
      setInfo(res);
    } catch {
      toast.error('Failed to fetch Redis info');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const nextSearch = search.trim();
    if (nextSearch === appliedSearch && keysPage === 1) {
      void fetchKeys(1);
      return;
    }
    setKeysPage(1);
    setAppliedSearch(nextSearch);
  }, [appliedSearch, fetchKeys, keysPage, search]);

  const handleKeysPageChange = useCallback((page: number) => {
    if (page === keysPagination.current_page || loading) return;
    setKeysPage(page);
  }, [keysPagination.current_page, loading]);

  const getSection = useCallback((infoData: RedisInfo | null, section: string): RedisInfoSection | null => {
    if (!infoData) return null;
    const value = infoData[section];
    if (value && typeof value === 'object') {
      return value as RedisInfoSection;
    }
    const hasSections = Object.values(infoData).some((entry) => entry && typeof entry === 'object');
    if (hasSections) {
      return null;
    }
    return infoData as RedisInfoSection;
  }, []);

  const infoEntries = useMemo(() => {
    if (!info) return [];
    const entries: Array<[string, string]> = [];
    Object.entries(info).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        Object.entries(value as RedisInfoSection).forEach(([subKey, subVal]) => {
          entries.push([`${key}.${subKey}`, String(subVal)]);
        });
      } else {
        entries.push([key, String(value ?? '')]);
      }
    });
    return entries;
  }, [info]);

  const serverInfo = getSection(info, 'Server');
  const memoryInfo = getSection(info, 'Memory');

  const handleAddKey = async () => {
    try {
      await redisService.addKey({
        key: newKeyData.key,
        value: newKeyData.value,
        ttl: newKeyData.ttl ? parseInt(newKeyData.ttl) : undefined,
        persist: newKeyData.persist,
      });
      toast.success('Key added successfully');
      setIsAddModalOpen(false);
      setNewKeyData({ key: '', value: '', ttl: '3600', persist: false });
      await fetchKeys(keysPage);
    } catch {
      toast.error('Failed to add key');
    }
  };

  const handleExpireKey = async (key: string, ttl = 604800) => {
    try {
      await redisService.expireKey(key, ttl);
      toast.success('TTL assigned successfully');
      await fetchKeys(keysPage);
    } catch {
      toast.error('Failed to assign TTL');
    }
  };

  const handleExpireLegacyIPLocation = async () => {
    if (!confirm('Set 7 days TTL for all legacy Laravel IP location cache keys?')) return;
    try {
      await redisService.expireLegacyIPLocation(604800);
      toast.success('Legacy IP location keys will expire automatically');
      await fetchKeys(keysPage);
    } catch {
      toast.error('Failed to expire legacy IP location keys');
    }
  };

  const handleCleanLegacyIPLocation = async () => {
    if (!confirm('Delete all legacy Laravel IP location cache keys matching *_cache_ip_location_*?')) return;
    try {
      await redisService.cleanLegacyIPLocation();
      toast.success('Legacy IP location cache keys cleaned');
      await fetchKeys(keysPage);
    } catch {
      toast.error('Failed to clean legacy IP location keys');
    }
  };

  const handleDeleteKey = async (key: string) => {
    if (!confirm(`Are you sure you want to delete key "${key}"?`)) return;
    try {
      await redisService.deleteKey(key);
      toast.success('Key deleted successfully');
      await fetchKeys(keysPage);
    } catch {
      toast.error('Failed to delete key');
    }
  };

  const handleUpdateEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await redisService.updateEnv(envSettings);
      toast.success('Environment settings updated successfully');
    } catch {
      toast.error('Failed to update settings');
    }
  };

  useEffect(() => {
    if (activeTab === 'keys') {
      fetchKeys(keysPage);
    }
  }, [activeTab, fetchKeys, keysPage]);

  useEffect(() => {
    if (activeTab === 'info') {
      fetchInfo();
    }
  }, [activeTab, fetchInfo]);

  // Authorization checks
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

  if (isAuthorized === false) {
    return <AccessDenied />;
  }

  // Columns for DataTable
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const columns = [
    { key: 'key', title: 'Key', sortable: true },
    { key: 'type', title: 'Type', render: (val: string) => <span className="font-mono text-xs">{val || '-'}</span> },
    { key: 'memory_usage_bytes', title: 'Memory', render: (val: number) => <span className="font-mono text-xs">{formatBytes(val)}</span> },
    {
      key: 'ttl',
      title: 'TTL',
      sortable: true,
      render: (_ttl: number, item: RedisKey) => (
        <span className={item.is_persistent ? 'text-red-600 font-semibold' : item.ttl < 60 ? 'text-orange-500' : 'text-green-600'}>
          {item.ttl_label || (item.ttl === -1 ? 'Persist' : item.ttl)}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, item: RedisKey) => (
        <div className="flex items-center gap-2">
          {item.is_persistent && (
            <Button variant="outline" size="sm" onClick={() => handleExpireKey(item.key)}>
              <Clock className="w-4 h-4" />
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => handleDeleteKey(item.key)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-8 h-8 text-red-500" />
            Redis Manager
          </h1>
          <p className="text-muted-foreground">Manage your Redis cache and configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => activeTab === 'keys' ? fetchKeys(keysPage) : fetchInfo()}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Key
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'keys' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('keys')}
        >
          Keys Management
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('info')}
        >
          Server Info
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          Configuration
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'keys' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Cache Keys</CardTitle>
                  <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                    <Input
                      placeholder="Search keys..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-64"
                    />
                    <select
                      value={ttlFilter}
                      onChange={(e) => { setTtlFilter(e.target.value as RedisTTLFilter); setKeysPage(1); }}
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="all">All TTL</option>
                      <option value="persistent">Persist only</option>
                      <option value="volatile">Expiring only</option>
                    </select>
                    <Button type="submit">
                      <Search className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="outline" onClick={handleExpireLegacyIPLocation}>
                      Expire IP Location
                    </Button>
                    <Button type="button" variant="danger" onClick={handleCleanLegacyIPLocation}>
                      Clean IP Location
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={keys} 
                  columns={columns} 
                  loading={loading}
                  pagination={keysPagination}
                  onPageChange={handleKeysPageChange}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'info' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Version</p>
                    <h3 className="text-2xl font-bold">{serverInfo?.redis_version || '-'}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <h3 className="text-2xl font-bold">{serverInfo?.uptime_in_days || '0'} days</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <HardDrive className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Memory Used</p>
                    <h3 className="text-2xl font-bold">{memoryInfo?.used_memory_human || '-'}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Full Info Table */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Full Server Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {infoEntries.map(([k, v]) => (
                    <div key={k} className="flex justify-between p-2 border rounded hover:bg-muted/50">
                      <span className="font-medium text-muted-foreground truncate" title={k}>{k}</span>
                      <span className="font-mono truncate ml-2" title={v}>{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Environment Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateEnv} className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Redis Host</label>
                    <Input 
                      value={envSettings.REDIS_HOST}
                      onChange={(e) => setEnvSettings({...envSettings, REDIS_HOST: e.target.value})}
                      placeholder="127.0.0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Redis Port</label>
                    <Input 
                      value={envSettings.REDIS_PORT}
                      onChange={(e) => setEnvSettings({...envSettings, REDIS_PORT: e.target.value})}
                      placeholder="6379"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Redis Password</label>
                    <Input 
                      type="password"
                      value={envSettings.REDIS_PASSWORD}
                      onChange={(e) => setEnvSettings({...envSettings, REDIS_PASSWORD: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Redis DB</label>
                    <Input 
                      value={envSettings.REDIS_DB}
                      onChange={(e) => setEnvSettings({...envSettings, REDIS_DB: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <Button type="submit" loading={loading}>
                    Update Configuration
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Add Key Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Key"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Key</label>
            <Input 
              value={newKeyData.key}
              onChange={(e) => setNewKeyData({...newKeyData, key: e.target.value})}
              placeholder="my_key"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Value</label>
            <Input 
              value={newKeyData.value}
              onChange={(e) => setNewKeyData({...newKeyData, value: e.target.value})}
              placeholder="some value"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">TTL (Seconds)</label>
            <Input 
              type="number"
              value={newKeyData.ttl}
              onChange={(e) => setNewKeyData({...newKeyData, ttl: e.target.value})}
              placeholder="3600"
              disabled={newKeyData.persist}
            />
            <p className="text-xs text-muted-foreground">Default is 3600 seconds. Persistent keys are disabled by default to protect Redis memory.</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newKeyData.persist}
              onChange={(e) => setNewKeyData({...newKeyData, persist: e.target.checked})}
            />
            Create as persistent key (advanced)
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddKey}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
