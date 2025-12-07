import { createBrowserRouter, type Router } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import TestSuites from './pages/TestSuites';
import CreateTest from './pages/CreateTest';
import EditTest from './pages/EditTest';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export const router: Router = createBrowserRouter([
    {
        path: '/',
        element: <AppLayout />,
        children: [
            { index: true, element: <Dashboard /> },
            { path: 'suites', element: <TestSuites /> },
            { path: 'create', element: <CreateTest /> },
            { path: 'edit/:id', element: <EditTest /> },
            { path: 'reports', element: <Reports /> },
            { path: 'settings', element: <Settings /> },
        ],
    },
]);
