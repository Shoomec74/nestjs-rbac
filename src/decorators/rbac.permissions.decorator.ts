import { SetMetadata } from '@nestjs/common';

// Этот декоратор используется для присвоения набора разрешений к методам или классам. Он принимает массив строк, где каждая строка представляет собой разрешение.
export const RBAcPermissions = (...permissions: string[]) => 
    SetMetadata('RBAcPermissions', permissions);

// Этот декоратор похож на RBAcPermissions, но используется в случаях, когда требуется выполнение хотя бы одного из перечисленных разрешений.
export const RBAcAnyPermissions = (...permissions: string[][]) => 
    SetMetadata('RBAcAnyPermissions', permissions);

// Декоратор для установки одного или нескольких асинхронных разрешений.
export const RBAcAsyncPermissions = (...permissions: string[]) => 
    SetMetadata('RBAcAsyncPermissions', permissions);

// Аналогичен RBAcAnyPermissions, но для асинхронных разрешений. Используется, когда достаточно выполнения хотя бы одного из асинхронных разрешений.
export const RBAcAnyAsyncPermissions = (...permissions: string[][]) => 
    SetMetadata('RBAcAnyAsyncPermissions', permissions);
