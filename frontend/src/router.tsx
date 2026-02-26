import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const MainLayout = lazy(() => import('./components/Layout/MainLayout'));
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const CharacterCreate = lazy(() => import('./pages/CharacterCreate'));
const CharacterDetail = lazy(() => import('./pages/CharacterDetail'));
const CharacterEdit = lazy(() => import('./pages/CharacterEdit'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const VoiceCall = lazy(() => import('./pages/VoiceCall'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserPage = lazy(() => import('./pages/UserPage'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <Login />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/register',
    element: (
      <SuspenseWrapper>
        <Register />
      </SuspenseWrapper>
    ),
  },
  {
    element: (
      <SuspenseWrapper>
        <MainLayout />
      </SuspenseWrapper>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'explore', element: <Explore /> },
      { path: 'character/create', element: <CharacterCreate /> },
      { path: 'character/:id', element: <CharacterDetail /> },
      { path: 'character/:id/edit', element: <CharacterEdit /> },
      { path: 'chat/:conversationId', element: <ChatPage /> },
      { path: 'voice/:conversationId', element: <VoiceCall /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
      { path: 'user/:userId', element: <UserPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
