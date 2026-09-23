import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import sipinnaLogo from '../assets/sipinna.png';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [correoOTelefono, setCorreoOTelefono] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // El backend acepta email o número (no ambos): el otro va explícitamente en null.
    const identificador = correoOTelefono.trim();
    const esCorreo = identificador.includes('@');

    try {
      await login({
        email: esCorreo ? identificador : null,
        number: esCorreo ? null : identificador,
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Credenciales incorrectas:', error);
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <img
          src={sipinnaLogo}
          alt="Sipinna"
          className="login-logo"
        />

        <h2>Iniciar sesión</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="correoOTelefono">
            Correo o número
          </label>

          <input
            id="correoOTelefono"
            type="text"
            placeholder="Ingresa tu correo o número"
            value={correoOTelefono}
            onChange={(event) =>
              setCorreoOTelefono(event.target.value)
            }
          />

          <label htmlFor="password">
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />

          <div className="login-options">
            <a href="#">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit">
            Iniciar sesión
          </button>
        </form>

        <p>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="register-link">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;