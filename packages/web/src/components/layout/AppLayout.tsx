import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-900">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <Header />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
