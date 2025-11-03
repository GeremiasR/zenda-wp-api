# API de Autenticación - Guía Frontend

## Descripción General

Este documento describe los endpoints de autenticación disponibles y proporciona ejemplos de implementación para la capa de servicios del frontend.

**Base URL:** `http://localhost:3000/api` (ajustar según entorno)

### 🚀 Optimización de Performance

La API utiliza **JWT tokens optimizados** para máximo rendimiento:

- ✅ **Sin consultas a DB en cada request**: El token contiene toda la información necesaria (userId, email, roleCode, shopId)
- ✅ **Validación de roles instantánea**: Los permisos se verifican directamente desde el token
- ✅ **Escalabilidad mejorada**: Menor carga en la base de datos
- ⚡ **Respuestas más rápidas**: No hay latencia de consultas DB para autenticación/autorización

**Estructura del Token JWT:**
```json
{
  "sub": "user_id",
  "email": "usuario@ejemplo.com",
  "roleCode": "ADMIN|SHOPADMIN|SHOPUSER",
  "shopId": "shop_id",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## 📋 Índice

1. [Endpoints Disponibles](#endpoints-disponibles)
2. [Modelos de Datos](#modelos-de-datos)
3. [Flujo de Autenticación](#flujo-de-autenticación)
4. [Implementación de Servicios](#implementación-de-servicios)
5. [Manejo de Tokens](#manejo-de-tokens)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Endpoints Disponibles

### 1. Login (Iniciar Sesión)

**Endpoint:** `POST /auth/login`

**Descripción:** Autentica un usuario con email y contraseña, devuelve tokens JWT.

**Request Body:**
```json
{
  "email": "admin@zenda.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "b1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

**Errores:**
- `400` - Email y contraseña son requeridos
- `400` - Formato de email inválido
- `401` - Credenciales inválidas
- `500` - Error interno del servidor

---

### 2. Refresh (Renovar Token)

**Endpoint:** `POST /auth/refresh`

**Descripción:** Renueva un token de acceso usando un refresh token válido.

**Request Body:**
```json
{
  "refresh_token": "b1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token renovado exitosamente",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

**Errores:**
- `400` - Refresh token es requerido
- `401` - Refresh token inválido o expirado

---

### 3. Logout (Cerrar Sesión)

**Endpoint:** `POST /auth/logout`

**Descripción:** Revoca un refresh token específico (cierra sesión en el dispositivo actual).

**Request Body:**
```json
{
  "refresh_token": "b1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

**Errores:**
- `400` - Refresh token requerido

---

### 4. Logout All (Cerrar Todas las Sesiones)

**Endpoint:** `POST /auth/logout-all`

**Descripción:** Revoca todos los refresh tokens del usuario autenticado (cierra sesión en todos los dispositivos).

**Headers Requeridos:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout de todos los dispositivos exitoso"
}
```

**Errores:**
- `401` - Usuario no autenticado

---

### 5. Get Profile (Obtener Perfil)

**Endpoint:** `GET /auth/me`

**Descripción:** Obtiene la información del usuario autenticado.

**Headers Requeridos:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Perfil obtenido exitosamente",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "admin",
    "email": "admin@zenda.com",
    "roleCode": "ADMIN",
    "shopId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errores:**
- `401` - Usuario no autenticado

---

### 6. Verify Token (Verificar Token)

**Endpoint:** `POST /auth/verify`

**Descripción:** Verifica si un token JWT es válido.

**Headers Requeridos:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "valid": true,
    "payload": {
      "sub": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "admin@zenda.com",
      "roleCode": "ADMIN",
      "shopId": "64f8a1b2c3d4e5f6a7b8c9d1"
    }
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Token inválido",
  "data": {
    "valid": false
  }
}
```

---

### 7. Health Check

**Endpoint:** `GET /auth/health`

**Descripción:** Verifica el estado del servicio de autenticación.

**Response (200):**
```json
{
  "success": true,
  "message": "Servicio de autenticación funcionando correctamente",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Modelos de Datos

### AuthTokens
```typescript
interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
```

### UserProfile
```typescript
interface UserProfile {
  id: string;
  username: string;
  email: string;
  roleCode: string;
  shopId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### ApiResponse<T>
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
```

### ApiError
```typescript
interface ApiError {
  success: false;
  message: string;
  error?: {
    statusCode: number;
    error: string;
    message: string;
  };
}
```

---

## Flujo de Autenticación

### 1. Login Flow
```
Usuario ingresa credenciales
    ↓
POST /auth/login
    ↓
Guardar access_token y refresh_token en localStorage/cookies
    ↓
Redireccionar a dashboard
```

### 2. Token Refresh Flow
```
Request con access_token expirado (401)
    ↓
POST /auth/refresh con refresh_token
    ↓
Actualizar access_token
    ↓
Reintentar request original
```

### 3. Logout Flow
```
Usuario hace click en "Cerrar sesión"
    ↓
POST /auth/logout con refresh_token
    ↓
Limpiar tokens del localStorage
    ↓
Redireccionar a login
```

---

## Implementación de Servicios

### TypeScript / JavaScript (Axios)

```typescript
// auth.service.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token automáticamente
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para refresh token automático
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newTokens = await this.refreshToken();
            this.setTokens(newTokens.access_token, newTokens.refresh_token);
            
            // Reintentar request original con nuevo token
            originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Si falla el refresh, hacer logout
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Login - Iniciar sesión
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    const response = await this.api.post<ApiResponse<AuthTokens>>('/auth/login', {
      email,
      password,
    });
    
    const { access_token, refresh_token } = response.data.data!;
    this.setTokens(access_token, refresh_token);
    
    return response.data.data!;
  }

  /**
   * Refresh Token - Renovar token de acceso
   */
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post<ApiResponse<AuthTokens>>(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken }
    );
    
    return response.data.data!;
  }

  /**
   * Logout - Cerrar sesión
   */
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    if (refreshToken) {
      try {
        await this.api.post('/auth/logout', { refresh_token: refreshToken });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
    
    this.clearTokens();
  }

  /**
   * Logout All - Cerrar todas las sesiones
   */
  async logoutAll(): Promise<void> {
    await this.api.post('/auth/logout-all');
    this.clearTokens();
  }

  /**
   * Get Profile - Obtener perfil del usuario
   */
  async getProfile(): Promise<UserProfile> {
    const response = await this.api.get<ApiResponse<UserProfile>>('/auth/me');
    return response.data.data!;
  }

  /**
   * Verify Token - Verificar validez del token
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await this.api.post<ApiResponse<{ valid: boolean }>>('/auth/verify');
      return response.data.data!.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/auth/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  // ====== Token Management ======

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export default new AuthService();

// Types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  roleCode: string;
  shopId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
```

---

## Manejo de Tokens

### Almacenamiento Seguro

**Opción 1: LocalStorage (Más simple)**
```typescript
localStorage.setItem('access_token', token);
localStorage.setItem('refresh_token', refreshToken);
```

**Opción 2: Cookies HttpOnly (Más seguro)**
```typescript
// Backend debe configurar cookies HttpOnly
// Frontend solo lee mediante document.cookie
```

**Opción 3: Memory Storage (Máxima seguridad, se pierde al recargar)**
```typescript
class TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
  }

  getAccessToken() {
    return this.accessToken;
  }
  
  // ...
}
```

### Refresh Token Automático

El interceptor de Axios ya implementado maneja automáticamente:
1. Detectar respuestas 401
2. Intentar renovar token
3. Reintentar request original
4. Si falla, hacer logout y redireccionar

---

## Ejemplos de Uso

### React con Context API

```typescript
// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { UserProfile } from '../services/auth.service';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const profile = await authService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
    await loadUser();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const logoutAll = async () => {
    await authService.logoutAll();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        logoutAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Componente de Login

```typescript
// LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        
        {error && <div className="error">{error}</div>}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};
```

### Protected Route

```typescript
// ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### Uso en App.tsx

```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## Notas Importantes

### Seguridad
- ✅ Los tokens de acceso expiran en 15 minutos (configurable via JWT_EXPIRES_IN)
- ✅ Los refresh tokens son de un solo uso y se renuevan en cada refresh
- ✅ Los refresh tokens expiran en 7 días (configurable via REFRESH_TOKEN_EXPIRES_IN)
- ✅ Usa HTTPS en producción
- ✅ No expongas tokens en URLs o logs
- ✅ Implementa CORS correctamente en el backend

### Best Practices
- 🔒 Almacena tokens de forma segura (HttpOnly cookies preferiblemente)
- 🔄 Implementa refresh token automático
- 🚪 Implementa logout en todos los casos de error 401
- ⏱️ Agrega timeouts a las peticiones
- 📝 Maneja errores de red apropiadamente
- 🔍 Valida email en el frontend antes de enviar

### Optimización de Performance
- 🚀 **El backend NO consulta la DB en cada request protegido**
- 🎯 Toda la información de autorización está en el token JWT
- ⚡ Los roles y permisos se validan instantáneamente desde el token
- 📊 Solo el endpoint `/auth/me` consulta la DB para obtener información completa del usuario
- 🔄 Si cambias el rol de un usuario, el cambio se aplicará cuando el token se renueve (máx. 15 min)

### Credenciales de Prueba
```
Admin:
  email: admin@zenda.com
  password: admin123

Usuario Regular:
  email: usuario@ejemplo.com
  password: password123
```

---

## Soporte

Para más información sobre la API, consulta:
- `AUTH_API.md` - Documentación completa de autenticación
- `API_ARCHITECTURE_SUMMARY.md` - Arquitectura general de la API
- Swagger UI: `http://localhost:3000/api-docs`

---

**Última actualización:** Octubre 2025  
**Versión API:** 1.0.0

