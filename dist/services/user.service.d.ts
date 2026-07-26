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
export declare class InvalidEmailError extends Error {
    constructor(email: string);
}
export declare class WeakPasswordError extends Error {
    constructor(reason: string);
}
export declare class UnauthorizedError extends Error {
    constructor(action: string, role: UserRole);
}
export declare class DuplicateEmailError extends Error {
    constructor(email: string);
}
export declare const PERMISSIONS: RBACPermission[];
export declare class UserService {
    private readonly EMAIL_REGEX;
    private readonly MIN_PASSWORD_LENGTH;
    private readonly PASSWORD_STRENGTH_REGEX;
    /** Almacén en memoria (en producción sería un repositorio inyectado) */
    private readonly users;
    /**
     * Registra un nuevo usuario con rol STANDARD por defecto.
     *
     * @throws InvalidEmailError si el formato del email es inválido
     * @throws WeakPasswordError si la contraseña no cumple requisitos
     * @throws DuplicateEmailError si el email ya existe
     */
    registerUser(email: string, pass: string, role?: UserRole): Promise<User>;
    /**
     * Verifica si un usuario con un rol dado puede ejecutar una acción.
     *
     * @throws UnauthorizedError si el rol no tiene permiso
     */
    authorize(role: UserRole, action: string): boolean;
    /**
     * Busca un usuario por email.
     */
    findByEmail(email: string): User | undefined;
    private validateEmail;
    private validatePassword;
    private checkDuplicate;
    private hashPassword;
}
//# sourceMappingURL=user.service.d.ts.map