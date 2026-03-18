export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    super(`Falta de permisos en Firestore para la operación: ${context.operation} en ${context.path}`);
    this.name = 'FirestorePermissionError';
    this.context = context;
    
    // Aseguramos que el contexto sea visible en logs y JSON.stringify
    Object.defineProperty(this, 'context', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: context
    });
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      stack: this.stack
    };
  }
}
