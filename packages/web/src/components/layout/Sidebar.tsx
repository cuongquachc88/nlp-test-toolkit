import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderKanban,
    MessageSquarePlus,
    FileBarChart,
    Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Test Suites', to: '/suites', icon: FolderKanban },
    { name: 'Create Test', to: '/create', icon: MessageSquarePlus },
    { name: 'Reports', to: '/reports', icon: FileBarChart },
    { name: 'Settings', to: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
    return (
        <div className="w-56 bg-gray-800 border-r border-gray-700 flex flex-col">
            {/* Logo */}
            <div className="h-14 flex items-center px-4 border-b border-gray-700">
                <h1 className="text-lg font-bold text-white">
                    NLP Test Toolkit
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-base',
                                isActive
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            )
                        }
                    >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                    v0.1.0
                </p>
            </div>
        </div>
    );
}
