import { Injectable } from '@nestjs/common';
import { IRbac } from './interfaces/rbac.interface';
import { StorageRbacService } from './storage.rbac.service';
import { RoleRbac } from '../role/role.rbac';
import { IRoleRbac } from '../role/interfaces/role.rbac.interface';
import { RbacExceptions } from '../exceptions/rbac.exceptions';
import { IParamsFilter } from '../params-filter/interfaces/params.filter.interface';

@Injectable()
export class RbacService implements IRbac {
  // Конструктор класса, принимающий сервис StorageRbacService.
  // Этот сервис предположительно предоставляет доступ к хранилищу данных RBAC, таким как роли, разрешения и фильтры.
  constructor(private readonly storageRbacService: StorageRbacService) {}

  // Асинхронный метод для получения объекта роли.
  async getRole(
    role: string,
    paramsFilter?: IParamsFilter,
  ): Promise<IRoleRbac> {
    // Получение данных о ролях и разрешениях из хранилища.
    const storage = await this.storageRbacService.getStorage();

    // Проверка существования запрашиваемой роли в хранилище.
    if (!storage.roles || !storage.roles.includes(role)) {
      // Если роль не найдена, выбрасывается исключение RbacExceptions.
      throw new RbacExceptions('There is no exist a role.');
    }

    // Создание и возвращение нового объекта RoleRbac с данными о роли, разрешениях и фильтрах.
    // RoleRbac - это класс, который реализует интерфейс IRoleRbac.
    return new RoleRbac(
      role,
      await this.storageRbacService.getGrant(role), // Получение разрешений для роли.
      await this.storageRbacService.getFilters(), // Получение фильтров.
      paramsFilter, // Передача фильтра параметров, если он предоставлен.
    );
  }
}
