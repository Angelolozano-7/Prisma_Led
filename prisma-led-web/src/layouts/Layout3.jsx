import { Outlet } from 'react-router-dom';

export default function Layout3() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-fondo-suave px-4">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-lg p-6">
        <Outlet />
      </div>
    </div>
  );
}
