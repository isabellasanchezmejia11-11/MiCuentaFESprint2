import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../App.css';

export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
