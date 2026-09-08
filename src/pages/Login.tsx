import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import sipinnaLogo from '../assets/sipinna.png';

function Login() {
  const navigate = useNavigate();
  const [correoOTelefono, setCorreoOTelefono] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      const loginData = {
        email: correoOTelefono,
        password: password,
      };

      console.log('Datos enviados:', loginData);

      const response = await fetch( 'http://localhost:3000/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log('Credenciales correctas');
        console.log(data);
        navigate('/dashboard', { replace: true });
      } else {
        console.log('Credenciales incorrectas');
        console.log(data);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
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