import { User } from '../types/contract';

export const usersData: User[] = [
  {
    id: '1',
    username: 'admin',
    fullName: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: '',
    lastLogin: '15/05/2025 08:30',
    status: 'active'
  },
  {
    id: '2',
    username: 'tuan',
    fullName: 'Nguyễn Văn Tuấn',
    email: 'tuan@example.com',
    role: 'manager',
    avatar: '',
    lastLogin: '14/05/2025 15:45',
    status: 'active'
  },
  {
    id: '3',
    username: 'binh',
    fullName: 'Trần Văn Bình',
    email: 'binh@example.com',
    role: 'manager',
    avatar: '',
    lastLogin: '14/05/2025 10:20',
    status: 'active'
  },
  {
    id: '4',
    username: 'nghia',
    fullName: 'Lê Văn Nghĩa',
    email: 'nghia@example.com',
    role: 'user',
    avatar: '',
    lastLogin: '13/05/2025 16:15',
    status: 'active'
  },
  {
    id: '5',
    username: 'tran',
    fullName: 'Phạm Thị Trân',
    email: 'tran@example.com',
    role: 'user',
    avatar: '',
    lastLogin: '10/05/2025 09:10',
    status: 'inactive'
  }
];