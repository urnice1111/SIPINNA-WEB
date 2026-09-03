import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';
import sipinnaLogo from "../assets/sipinna.png";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log('Correo:', email);
    console.log('Contraseña:', password);
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <img src={sipinnaLogo} alt="Sipinna" className="login-logo" />

        <h2>Iniciar sesión</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Correo o número</label>

          <input
            id="email"
            type="text"
            placeholder="Ingresa tú correo o número"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="password">Contraseña</label>

          <input
            id="password"
            type="password"
            placeholder="Ingresa tú contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <div className="login-options">
            <label>
              <input type="checkbox" />
              Recordarme
            </label>

            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit">Iniciar sesión</button>
        </form>

        <p>
          ¿No tienes cuenta? <Link to="/register" className="register-link">Regístrate</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;