import { ASTVisitor } from './visitor.js';

export interface ASTNode {
  type: string;
  accept<T>(visitor: ASTVisitor<T>): T;
}

export abstract class BaseNode implements ASTNode {
  constructor(public readonly type: string) {}
  abstract accept<T>(visitor: ASTVisitor<T>): T;
}
