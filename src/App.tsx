import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Toaster } from 'sonner';

// Lazy Load Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register').then(module => ({ default: module.Register })));
const CreatorOverview = lazy(() => import('./pages/creator/CreatorOverview'));
const ContentList = lazy(() => import('./pages/creator/ContentList'));
const CreatePost = lazy(() => import('./pages/creator/CreatePost'));
const MediaLibrary = lazy(() => import('./pages/creator/MediaLibrary'));
const UploadMedia = lazy(() => import('./pages/creator/UploadMedia'));
const SubscribersList = lazy(() => import('./pages/creator/SubscribersList'));
const PricingPage = lazy(() => import('./pages/creator/PricingPage'));
const Settings = lazy(() => import('./pages/creator/Settings'));
const ProfileCMS = lazy(() => import('./pages/creator/ProfileCMS'));
const KYCSubmission = lazy(() => import('./pages/creator/KYCSubmission'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Explore = lazy(() => import('./pages/consumer/Explore'));
const CreatorProfile = lazy(() => import('./pages/consumer/CreatorProfile'));
import { ConsumerLayout } from './layouts/ConsumerLayout';
import { AdminLayout } from './layouts/AdminLayout';

const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const KYCReview = lazy(() => import('./pages/admin/KYCReview'));
const PaymentReview = lazy(() => import('./pages/admin/PaymentReview'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminPlans = lazy(() => import('./pages/admin/Plans'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

const Feed = lazy(() => import('./pages/consumer/Feed'));
const SubscriptionsList = lazy(() => import('./pages/consumer/SubscriptionsList'));
const ConsumerPayments = lazy(() => import('./pages/consumer/Payments'));
const ConsumerSettings = lazy(() => import('./pages/consumer/Settings'));
const PostDetail = lazy(() => import('./pages/consumer/PostDetail'));
const SubscriptionCheckout = lazy(() => import('./pages/consumer/SubscriptionCheckout'));

function LoadingSpinner() {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
    );
}

// Logic to handle intelligent root redirect
function RootRedirect() {
    const { user, isLoading } = useAuth();
    if (isLoading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" replace />;

    // Redirect based on role
    switch (user.role) {
        case 'admin': return <Navigate to="/admin" replace />;
        case 'creator': return <Navigate to="/dashboard" replace />;
        case 'consumer': return <Navigate to="/explore" replace />;
        default: return <Navigate to="/login" replace />;
    }
}

function RoleGuard({ children, allowedRoles }: { children: React.ReactElement, allowedRoles: string[] }) {
    const { user, isLoading } = useAuth();
    if (isLoading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" replace />;
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster richColors position="top-right" />
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/feed" element={<Feed />} />

                        {/* Root Redirect */}
                        <Route path="/" element={<RootRedirect />} />

                        {/* Creator Routes (Strict Protection) */}
                        <Route element={
                            <RoleGuard allowedRoles={['creator']}>
                                <DashboardLayout />
                            </RoleGuard>
                        }>
                            <Route path="dashboard" element={<CreatorOverview />} />
                            <Route path="creator">
                                <Route path="content" element={<ContentList />} />
                                <Route path="content/new" element={<CreatePost />} />
                                <Route path="media" element={<MediaLibrary />} />
                                <Route path="upload" element={<UploadMedia />} />
                                <Route path="subscribers" element={<SubscribersList />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="pricing" element={<PricingPage />} />
                                <Route path="profile" element={<ProfileCMS />} />
                                <Route path="kyc" element={<KYCSubmission />} />
                                <Route path="users" element={<div>Users Placeholder</div>} />
                            </Route>
                        </Route>

                        {/* Consumer Routes (Strict Protection) */}
                        <Route element={
                            <RoleGuard allowedRoles={['consumer', 'creator']}>
                                <ConsumerLayout />
                            </RoleGuard>
                        }>
                            <Route path="explore" element={<Explore />} />
                            <Route path="creator/:creatorId" element={<CreatorProfile />} />
                            <Route path="creator/:creatorId" element={<CreatorProfile />} />
                            <Route path="subscriptions" element={<SubscriptionsList />} />
                            <Route path="subscribe/:subId" element={<SubscriptionCheckout />} />
                            <Route path="payments" element={<ConsumerPayments />} />
                            <Route path="settings" element={<ConsumerSettings />} />
                            <Route path="post/:postId" element={<PostDetail />} />
                        </Route>

                        {/* Admin Routes (Strict Protection) */}
                        <Route path="admin" element={
                            <RoleGuard allowedRoles={['admin']}>
                                <AdminLayout />
                            </RoleGuard>
                        }>
                            <Route index element={<AdminOverview />} />
                            <Route path="kyc" element={<KYCReview />} />
                            <Route path="payments" element={<PaymentReview />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="plans" element={<AdminPlans />} />
                            <Route path="settings" element={<AdminSettings />} />
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}