'use client';

import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { motion } from 'framer-motion';

const products = [
  { name: 'تطوير موقع ويب', sales: 234, percentage: 85, color: 'bg-blue-500' },
  { name: 'تصميم تطبيق موبايل', sales: 189, percentage: 72, color: 'bg-green-500' },
  { name: 'تصميم هوية بصرية', sales: 156, percentage: 65, color: 'bg-purple-500' },
  { name: 'تسويق رقمي', sales: 123, percentage: 55, color: 'bg-orange-500' },
  { name: 'استضافة سحابية', sales: 98, percentage: 45, color: 'bg-cyan-500' },
];

export default function TopProducts() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>أفضل الخدمات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{product.name}</span>
                <span className="text-muted-foreground">{product.sales} مبيعات</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${product.percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-full rounded-full ${product.color}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
