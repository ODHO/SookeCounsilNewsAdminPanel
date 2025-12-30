import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
// import { Testimonials } from './pages/testimonials/Testimonials';
import { Categories } from './pages/categories/Categories';
// import { Products } from './pages/products/Products';
import { Blogs } from './pages/blogs/Blogs';
// import { Orders } from './pages/orders/Orders';
import { User } from './types';
import { Enquiries } from './pages/enquiries/Enquiries';
import { ChangePassword } from './pages/changepassword/ChangePassword';
// import { Services } from './pages/services/Services';
// import { ServiceBookings } from './pages/servicebookings/ServiceBookings';
import { About } from './pages/about/About';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const storedUser = localStorage.getItem('glory_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    localStorage.setItem('glory_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('glory_user');
    setUser(null);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/categories" element={<Categories token={user.token} />} />
          {/* <Route path="/products" element={<Products token={user.token} />} /> */}
          {/* <Route path="/testimonials" element={<Testimonials token={user.token} />} /> */}
          <Route path="/news" element={<Blogs token={user.token} />} />
          <Route path="/about-content" element={<About token={user.token} />} />
          {/* <Route path="/orders" element={<Orders token={user.token} />} /> */}
          {/* <Route path="/service-bookings" element={<ServiceBookings token={user.token} />} /> */}
          <Route path="/inquiries" element={<Enquiries token={user.token} />} />
          <Route path="/changepassword" element={<ChangePassword token={user.token} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;