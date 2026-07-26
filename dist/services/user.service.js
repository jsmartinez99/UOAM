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
import { randomUUID } from 'crypto';
// ─── Errores de dominio ──────────────────────────────────────────
export class InvalidEmailError extends Error {
    constructor(email) {
        super(`Email inválido: El formato no es correcto (${email})`);
        this.name = 'InvalidEmailError';
    }
}
export class WeakPasswordError extends Error {
    constructor(reason) {
        super(`Seguridad inválida: ${reason}`);
        this.name = 'WeakPasswordError';
    }
}
export class UnauthorizedError extends Error {
    constructor(action, role) {
        super(`Acceso denegado: el rol '${role}' no tiene permiso para '${action}'`);
        this.name = 'UnauthorizedError';
    }
}
export class DuplicateEmailError extends Error {
    constructor(email) {
        super(`El email '${email}' ya está registrado`);
        this.name = 'DuplicateEmailError';
    }
}
// ─── Definición de permisos RBAC ─────────────────────────────────
export const PERMISSIONS = [
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
    EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    MIN_PASSWORD_LENGTH = 8;
    PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    /** Almacén en memoria (en producción sería un repositorio inyectado) */
    users = new Map();
    /**
     * Registra un nuevo usuario con rol STANDARD por defecto.
     *
     * @throws InvalidEmailError si el formato del email es inválido
     * @throws WeakPasswordError si la contraseña no cumple requisitos
     * @throws DuplicateEmailError si el email ya existe
     */
    async registerUser(email, pass, role = 'STANDARD') {
        this.validateEmail(email);
        this.validatePassword(pass);
        this.checkDuplicate(email);
        const hashedPassword = await this.hashPassword(pass);
        const user = {
            id: randomUUID(),
            email: email.toLowerCase().trim(),
            role,
            createdAt: new Date(),
            hashedPassword,
        };
        this.users.set(user.id, user);
        // Devolvemos sin el hash
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        };
    }
    /**
     * Verifica si un usuario con un rol dado puede ejecutar una acción.
     *
     * @throws UnauthorizedError si el rol no tiene permiso
     */
    authorize(role, action) {
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
    findByEmail(email) {
        const normalized = email.toLowerCase().trim();
        for (const user of this.users.values()) {
            if (user.email === normalized) {
                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt,
                };
            }
        }
        return undefined;
    }
    // ── Validaciones privadas ──
    validateEmail(email) {
        if (!email || !this.EMAIL_REGEX.test(email.trim())) {
            throw new InvalidEmailError(email || '(vacío)');
        }
    }
    validatePassword(pass) {
        if (!pass || pass.length < this.MIN_PASSWORD_LENGTH) {
            throw new WeakPasswordError(`La contraseña debe tener al menos ${this.MIN_PASSWORD_LENGTH} caracteres.`);
        }
        if (!this.PASSWORD_STRENGTH_REGEX.test(pass)) {
            throw new WeakPasswordError('La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial.');
        }
    }
    checkDuplicate(email) {
        const normalized = email.toLowerCase().trim();
        for (const user of this.users.values()) {
            if (user.email === normalized) {
                throw new DuplicateEmailError(normalized);
            }
        }
    }
    async hashPassword(pass) {
        // Simulación — en producción: bcrypt.hash(pass, 12) o Argon2
        return `hashed_${pass}`;
    }
}
//# sourceMappingURL=user.service.js.map