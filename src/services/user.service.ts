/**
 * Módulo E: Gestión de Usuarios e Infraestructura (Identity & RBAC)
 *
 * Autenticación vía JWT con control de acceso basado en roles:
 *   - STANDARD: acceso de lectura al catálogo y búsqueda semántica
 *   - ARRANGER: puede crear/editar perfiles y ejecutar hibridación
 *   - ADMIN: gestión completa del sistema
 *
 * Patrón: Domain Service con validaciones robustas.
 * En producción el hash iría con bcrypt/Argon2.
 */

import { AppDataSource } from '../infrastructure/database/data-source.js';
import { UserEntity } from '../infrastructure/database/entities/user.entity.js';

// ─── Tipos de dominio ────────────────────────────────────────────

export type UserRole = 'STANDARD' | 'ARRANGER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

/** Mapa de permisos por operación */
export interface RBACPermission {
  action: string;
  allowedRoles: UserRole[];
}

// ─── Errores de dominio ──────────────────────────────────────────

export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Email inválido: El formato no es correcto (${email})`);
    this.name = 'InvalidEmailError';
  }
}

export class WeakPasswordError extends Error {
  constructor(reason: string) {
    super(`Seguridad inválida: ${reason}`);
    this.name = 'WeakPasswordError';
  }
}

export class UnauthorizedError extends Error {
  constructor(action: string, role: UserRole) {
    super(`Acceso denegado: el rol '${role}' no tiene permiso para '${action}'`);
    this.name = 'UnauthorizedError';
  }
}

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`El email '${email}' ya está registrado`);
    this.name = 'DuplicateEmailError';
  }
}

// ─── Definición de permisos RBAC ─────────────────────────────────

export const PERMISSIONS: RBACPermission[] = [
  { action: 'catalog:read', allowedRoles: ['STANDARD', 'ARRANGER', 'ADMIN'] },
  { action: 'catalog:write', allowedRoles: ['ARRANGER', 'ADMIN'] },
  { action: 'hybrid:execute', allowedRoles: ['ARRANGER', 'ADMIN'] },
  { action: 'search:semantic', allowedRoles: ['STANDARD', 'ARRANGER', 'ADMIN'] },
  { action: 'llm:generate', allowedRoles: ['ARRANGER', 'ADMIN'] },
  { action: 'users:manage', allowedRoles: ['ADMIN'] },
  { action: 'system:config', allowedRoles: ['ADMIN'] },
];

// ─── Servicio de Usuarios ────────────────────────────────────────

export class UserService {
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly MIN_PASSWORD_LENGTH = 8;
  private readonly PASSWORD_STRENGTH_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  /**
   * Registra un nuevo usuario con rol STANDARD por defecto.
   *
   * @throws InvalidEmailError si el formato del email es inválido
   * @throws WeakPasswordError si la contraseña no cumple requisitos
   * @throws DuplicateEmailError si el email ya existe
   */
  async registerUser(email: string, pass: string, role: UserRole = 'STANDARD'): Promise<User> {
    this.validateEmail(email);
    this.validatePassword(pass);

    const userRepository = AppDataSource.getRepository(UserEntity);
    const normalizedEmail = email.toLowerCase().trim();
    
    const existingUser = await userRepository.findOneBy({ email: normalizedEmail });
    if (existingUser) {
      throw new DuplicateEmailError(normalizedEmail);
    }

    const hashedPassword = await this.hashPassword(pass);
    const user = userRepository.create({
      email: normalizedEmail,
      role,
      hashedPassword,
    });

    await userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt,
    };
  }

  /**
   * Verifica si un usuario con un rol dado puede ejecutar una acción.
   *
   * @throws UnauthorizedError si el rol no tiene permiso
   */
  authorize(role: UserRole, action: string): boolean {
    const permission = PERMISSIONS.find((p) => p.action === action);
    if (!permission) {
      throw new Error(`Acción desconocida: '${action}'`);
    }

    if (!permission.allowedRoles.includes(role)) {
      throw new UnauthorizedError(action, role);
    }

    return true;
  }

  /**
   * Busca un usuario por email.
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const user = await userRepository.findOneBy({ email: email.toLowerCase().trim() });
    
    if (!user) return undefined;

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt,
    };
  }

  // ── Validaciones privadas ──

  private validateEmail(email: string): void {
    if (!email || !this.EMAIL_REGEX.test(email.trim())) {
      throw new InvalidEmailError(email || '(vacío)');
    }
  }

  private validatePassword(pass: string): void {
    if (!pass || pass.length < this.MIN_PASSWORD_LENGTH) {
      throw new WeakPasswordError(
        `La contraseña debe tener al menos ${this.MIN_PASSWORD_LENGTH} caracteres.`,
      );
    }

    if (!this.PASSWORD_STRENGTH_REGEX.test(pass)) {
      throw new WeakPasswordError(
        'La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial.',
      );
    }
  }

  private async hashPassword(pass: string): Promise<string> {
    // Simulación — en producción: bcrypt.hash(pass, 12) o Argon2
    return `hashed_${pass}`;
  }
}
