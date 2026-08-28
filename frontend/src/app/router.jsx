import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import AboutPage from '../pages/AboutPage.jsx';
import CartPage from '../pages/CartPage.jsx';
import ChatbotPage from '../pages/ChatbotPage.jsx';
import CheckoutPage from '../pages/CheckoutPage.jsx';
import ContactPage from '../pages/ContactPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import LegacyRedirect from '../pages/LegacyRedirect.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import LoyaltyPage from '../pages/LoyaltyPage.jsx';
import { PolicyPage, TermsPage } from '../pages/LegalPages.jsx';
import AdminPage from '../pages/AdminPage.jsx';
import NewsDetailPage from '../pages/NewsDetailPage.jsx';
import NewsPage from '../pages/NewsPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import OrdersPage from '../pages/OrdersPage.jsx';
import OrderTrackingPage from '../pages/OrderTrackingPage.jsx';
import ProductDetailPage from '../pages/ProductDetailPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ShopPage from '../pages/ShopPage.jsx';
import TutorialPage from '../pages/TutorialPage.jsx';
import TryOnPage from '../pages/TryOnPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: 'about.html',
        element: <LegacyRedirect to="/about" />,
      },
      {
        path: 'contact',
        element: <ContactPage />,
      },
      {
        path: 'contact.html',
        element: <LegacyRedirect to="/contact" />,
      },
      {
        path: 'shop',
        element: <ShopPage />,
      },
      {
        path: 'shop.html',
        element: <LegacyRedirect to="/shop" />,
      },
      {
        path: 'cart',
        element: <CartPage />,
      },
      {
        path: 'cart.html',
        element: <LegacyRedirect to="/cart" />,
      },
      {
        path: 'chatbot',
        element: <ChatbotPage />,
      },
      {
        path: 'chatbotAI.html',
        element: <LegacyRedirect to="/chatbot" />,
      },
      {
        path: 'ai-tryon',
        element: <TryOnPage />,
      },
      {
        path: 'ai-tryon.html',
        element: <LegacyRedirect to="/ai-tryon" />,
      },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'checkout.html',
        element: <LegacyRedirect to="/checkout" />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'login.html',
        element: <LegacyRedirect to="/login" />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'register.html',
        element: <LegacyRedirect to="/register" />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'orders.html',
        element: <LegacyRedirect to="/orders" />,
      },
      {
        path: 'order-tracking',
        element: <OrderTrackingPage />,
      },
      {
        path: 'order-tracking.html',
        element: <LegacyRedirect to="/order-tracking" />,
      },
      {
        path: 'orders/:orderId',
        element: <OrderTrackingPage />,
      },
      {
        path: 'product',
        element: <ProductDetailPage />,
      },
      {
        path: 'product/:id',
        element: <ProductDetailPage />,
      },
      {
        path: 'productDetail.html',
        element: <LegacyRedirect to="/product" />,
      },
      {
        path: 'policy',
        element: <PolicyPage />,
      },
      {
        path: 'policy.html',
        element: <LegacyRedirect to="/policy" />,
      },
      {
        path: 'terms',
        element: <TermsPage />,
      },
      {
        path: 'terms.html',
        element: <LegacyRedirect to="/terms" />,
      },
      {
        path: 'tutorial',
        element: <TutorialPage />,
      },
      {
        path: 'tutorial.html',
        element: <LegacyRedirect to="/tutorial" />,
      },
      {
        path: 'loyalty',
        element: <LoyaltyPage />,
      },
      {
        path: 'loyalty.html',
        element: <LegacyRedirect to="/loyalty" />,
      },
      {
        path: 'news',
        element: <NewsPage />,
      },
      {
        path: 'news.html',
        element: <LegacyRedirect to="/news" />,
      },
      {
        path: 'news_detail',
        element: <NewsDetailPage />,
      },
      {
        path: 'news_detail.html',
        element: <LegacyRedirect to="/news_detail" />,
      },
      {
        path: 'index.html',
        element: <LegacyRedirect to="/" />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/shop-admin.html',
    element: <LegacyRedirect to="/admin" />,
  },
]);
