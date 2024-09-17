import { Injectable } from '@nestjs/common';
import { IRoleRbac } from './interfaces/role.rbac.interface';
import { IFilterPermission } from '../permissions/interfaces/filter.permission.interface';
import { IParamsFilter } from '../params-filter/interfaces/params.filter.interface';

@Injectable()
export class RoleRbac implements IRoleRbac {
  constructor(
    private readonly role: string,
    private readonly grant: string[],
    private readonly filters: object,
    private readonly paramsFilter?: IParamsFilter,
  ) {}

  // Асинхронный метод для проверки, имеет ли роль все указанные разрешения.
  canAsync(...permissions: string[]): Promise<boolean> {
    // Вызывает приватный метод checkPermissions с типом возвращаемого значения Promise<boolean>.
    return this.checkPermissions<Promise<boolean>>(permissions, 'canAsync');
  }

  // Синхронный метод для проверки, имеет ли роль все указанные разрешения.
  can(...permissions: string[]): boolean {
    // Вызывает приватный метод checkPermissions с типом возвращаемого значения boolean.
    return this.checkPermissions<boolean>(permissions, 'can');
  }

  // Синхронный метод для проверки наличия хотя бы одного разрешения из каждой группы.
  any(...permissions: string[][]): boolean {
    return (
      permissions
        .map((permission) => {
          // Для каждой группы разрешений вызывает метод can.
          return this.can(...permission);
        })
        // Возвращает true, если хотя бы один вызов can вернул true.
        .some((result) => result)
    );
  }

  // Асинхронный метод для проверки наличия хотя бы одного разрешения из каждой группы.
  async anyAsync(...permissions: string[][]): Promise<boolean> {
    return (
      (
        await Promise.all(
          permissions.map((permission) => {
            // Для каждой группы разрешений вызывает асинхронный метод canAsync.
            return this.canAsync(...permission);
          }),
        )
      )
        // Возвращает true, если хотя бы один вызов canAsync вернул true.
        .some((result) => result)
    );
  }

  // Приватный метод для общей логики проверки разрешений.
  private checkPermissions<T>(permissions, methodName): T {
    // Если список разрешений пуст, возвращает false.
    if (!permissions.length) {
      return false as any;
    }

    // Проверка наличия разрешений в списке grant.
    for (const permission of permissions) {
      if (!this.grant.includes(permission)) {
        return false as any;
      }
    }

    // Проверка пользовательских фильтров для разрешений.
    for (const permission of permissions) {
      if (this.grant.includes(permission) && permission.includes('@')) {
        // Если разрешение содержит '@', извлекается имя фильтра.
        const filter: string = permission.split('@')[1];
        const filterService: IFilterPermission = this.filters[filter];
        if (filterService) {
          // Вызов метода фильтра (can или canAsync) с параметрами фильтра.
          return (
            filterService?.[methodName]?.(
              this.paramsFilter ? this.paramsFilter.getParam(filter) : null,
            ) ?? true
          );
        }
      }
      if (this.grant.includes(permission) && !permission.includes('@')) {
        for (const filter in this.filters) {
          if (
            this.filters.hasOwnProperty(filter) &&
            this.grant.includes(`${permission}@${filter}`)
          ) {
            // Вызов метода фильтра для разрешения без '@'.
            return (
              this.filters[filter]?.[methodName]?.(
                this.paramsFilter ? this.paramsFilter.getParam(filter) : null,
              ) ?? true
            );
          }
        }
      }
    }

    // Возвращает true, если все проверки пройдены успешно.
    return true as any;
  }
}
