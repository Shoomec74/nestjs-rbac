import { IStorageRbac } from './storage.rbac.interface';

// Определение интерфейса IDynamicStorageRbac.
export interface IDynamicStorageRbac {
    // Метод getRbac, который должен быть реализован классом, реализующим этот интерфейс.
    // Метод возвращает Promise, который при разрешении возвращает экземпляр IStorageRbac.
    getRbac(): Promise<IStorageRbac>;
}
