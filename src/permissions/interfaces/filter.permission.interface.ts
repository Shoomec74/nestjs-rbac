// Определение интерфейса IFilterPermission.
export interface IFilterPermission {
    // Опциональный метод can, который может быть использован для синхронной проверки разрешений.
    // Этот метод должен использоваться только с декоратором @RBAcPermissions.
    // Принимает опциональный массив параметров и возвращает boolean значение, указывающее на наличие или отсутствие разрешения.
    can?(params?: any[]): boolean;

    // Опциональный метод canAsync, предназначенный для асинхронной проверки разрешений.
    // Этот метод должен использоваться только с декоратором @RBAcAsyncPermissions.
    // Принимает опциональный массив параметров и возвращает Promise, который разрешается в boolean значение,
    // указывающее на наличие или отсутствие разрешения.
    canAsync?(params?: any[]): Promise<boolean>;
}

