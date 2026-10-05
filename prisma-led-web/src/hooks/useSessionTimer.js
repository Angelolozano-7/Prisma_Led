/**
 * Control de inactividad de la sesión.
 *
 * Reinicia un temporizador con la actividad del usuario. Tras 60 minutos de
 * inactividad solicita confirmación y, si el usuario continúa, llama a
 * /auth/refresh-token para reemplazar el JWT de localStorage.
 *
 * Su integración con rutas públicas y las redirecciones se revisará en la
 * fase técnica de cierre.
 */

import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';

export function useSessionTimer() {
  const timerRef = useRef(null);

  const startTimer = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(showSessionWarning, 60 * 60 * 1000); // 60 minutos
  };

  const showSessionWarning = async () => {
    const result = await Swal.fire({
      title: '¿Deseas continuar con tu sesión?',
      text: 'Tu sesión está a punto de expirar por inactividad.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cerrar sesión',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (result.isConfirmed) {
      try {
        const res = await api.post('/auth/refresh-token');
        const { token } = res.data;
        localStorage.setItem('token', token);
        startTimer(); // Reinicia el temporizador
      } catch (err) {
        localStorage.removeItem('token');
        await Swal.fire('Error', 'No se pudo extender la sesión. Por favor, inicia sesión nuevamente.', 'error');
        window.location.href = '/auth/login';
      }
    } else {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
  };

  useEffect(() => {
    const handleActivity = () => startTimer();

    startTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);
}
