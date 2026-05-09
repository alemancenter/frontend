'use client';

import { Eye, Edit, Trash2 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const orders = [
  {
    id: '#12345',
    customer: 'أحمد محمد',
    email: 'ahmed@email.com',
    service: 'تطوير موقع ويب',
    amount: '5,000 ر.س',
    status: 'completed',
    date: '2024-01-15',
  },
  {
    id: '#12346',
    customer: 'سارة علي',
    email: 'sara@email.com',
    service: 'تصميم تطبيق',
    amount: '8,500 ر.س',
    status: 'pending',
    date: '2024-01-14',
  },
  {
    id: '#12347',
    customer: 'محمد خالد',
    email: 'mohammed@email.com',
    service: 'هوية بصرية',
    amount: '3,200 ر.س',
    status: 'processing',
    date: '2024-01-13',
  },
  {
    id: '#12348',
    customer: 'نورة سعد',
    email: 'noura@email.com',
    service: 'تسويق رقمي',
    amount: '2,000 ر.س',
    status: 'completed',
    date: '2024-01-12',
  },
  {
    id: '#12349',
    customer: 'فهد عبدالله',
    email: 'fahad@email.com',
    service: 'استضافة سحابية',
    amount: '1,500 ر.س',
    status: 'cancelled',
    date: '2024-01-11',
  },
];

const statusStyles = {
  completed: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  processing: 'bg-primary/10 text-primary',
  cancelled: 'bg-error/10 text-error',
};

const statusLabels = {
  completed: 'مكتمل',
  pending: 'قيد الانتظار',
  processing: 'قيد التنفيذ',
  cancelled: 'ملغي',
};

export default function RecentOrders() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>الطلبات الأخيرة</CardTitle>
        <Button variant="outline" size="sm">
          عرض الكل
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  رقم الطلب
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  العميل
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  الخدمة
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  المبلغ
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  الحالة
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  التاريخ
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span className="font-medium text-primary">{order.id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium">{order.customer}</p>
                      <p className="text-sm text-muted-foreground">{order.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm">{order.service}</td>
                  <td className="py-4 px-4 font-medium">{order.amount}</td>
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                        statusStyles[order.status as keyof typeof statusStyles]
                      )}
                    >
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {order.date}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="View order">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Edit order">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-error/10 transition-colors" aria-label="Delete order">
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
