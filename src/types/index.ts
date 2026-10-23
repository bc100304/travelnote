export type CategoryType = '餐飲' | '交通' | '住宿' | '門票' | '購物' | '其他';

export interface ExpenseRecord {
  id: string;
  tripName: string;
  time: string; // YYYY-MM-DDTHH:mm or ISO format
  itemName: string;
  amount: number;
  payer: string;
  category: CategoryType;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  mapUrl: string;
  notes: string;
  syncStatus: 'synced' | 'pending' | 'failed' | 'local_only';
  syncError?: string;
  createdAt: number;
}

export interface TripSettings {
  tripName: string;
  startDate: string;
  endDate: string;
  totalPeople: number;
  gasApiUrl: string;
  defaultPayer: string;
  payersList: string[];
}

export interface CategoryMeta {
  name: CategoryType;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconName: string;
}

export const CATEGORIES: Record<CategoryType, {
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
}> = {
  餐飲: {
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    icon: 'Utensils',
  },
  交通: {
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: 'Car',
  },
  住宿: {
    color: 'from-indigo-500 to-violet-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    icon: 'Hotel',
  },
  門票: {
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    icon: 'Ticket',
  },
  購物: {
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    icon: 'ShoppingBag',
  },
  其他: {
    color: 'from-slate-500 to-gray-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-700',
    icon: 'MoreHorizontal',
  },
};
