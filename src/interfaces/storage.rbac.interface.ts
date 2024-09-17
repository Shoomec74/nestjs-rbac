import { IFilterPermission } from '../permissions/interfaces/filter.permission.interface';

// Определение интерфейса IStorageRbac.
export interface IStorageRbac {
    // Массив строк, представляющих роли в системе RBAC.
    roles: string[];

    // Объект, представляющий разрешения в системе. 
    // Структура этого объекта не определена здесь и может варьироваться в зависимости от реализации.
    permissions: object;

    // Объект, представляющий правила предоставления доступа (grants) в системе.
    // Этот объект, как и permissions, имеет гибкую структуру и определяется в конкретной реализации.
    grants: object;

    // Объект для хранения фильтров. Ключами являются строки, а значениями - объекты, которые могут быть либо любого типа, либо соответствовать интерфейсу IFilterPermission.
    filters: { [key: string]: any | IFilterPermission };
}
