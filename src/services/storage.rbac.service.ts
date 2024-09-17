import { Inject, Injectable, Optional } from '@nestjs/common';
import { IStorageRbac } from '../interfaces/storage.rbac.interface';
import { IDynamicStorageRbac } from '../interfaces/dynamic.storage.rbac.interface';
import { ICacheRBAC } from '../interfaces/cache.rbac.interface';
import { Ctr } from '../ctr/ctr';

@Injectable()
export class StorageRbacService {
  // Конструктор класса с внедрением зависимостей.
  constructor(
    // IDynamicStorageRbac предоставляет динамический доступ к данным RBAC.
    @Inject('IDynamicStorageRbac')
    private readonly rbac: IDynamicStorageRbac,

    // ICacheRBAC - опциональная зависимость, предоставляющая кэширование данных RBAC.
    @Optional()
    @Inject('ICacheRBAC')
    private readonly cache?: ICacheRBAC,
  ) {}

  // Метод для получения всего хранилища RBAC.
  async getStorage(): Promise<IStorageRbac> {
    return await this.rbac.getRbac();
  }

  // Метод для получения всех разрешений из хранилища RBAC.
  async getPermissions(): Promise<object> {
    return (await this.rbac.getRbac()).permissions;
  }

  // Метод для получения всех прав доступа из хранилища RBAC.
  async getGrants(): Promise<object> {
    return (await this.rbac.getRbac()).grants;
  }

  // Метод для получения всех ролей из хранилища RBAC.
  async getRoles(): Promise<string[]> {
    return (await this.rbac.getRbac()).roles;
  }

  // Метод для получения списка разрешений для конкретной роли.
  async getGrant(role: string): Promise<string[]> {
    const grant: object = await this.parseGrants();

    // Возвращает список разрешений для заданной роли, если они есть, иначе возвращает пустой массив.
    return grant[role] || [];
  }

  // Метод для получения всех фильтров из хранилища RBAC.
  async getFilters(): Promise<object> {
    const result: any = {};
    const filters = (await this.getStorage()).filters;

    // Цикл по всем ключам в объекте фильтров.
    for (const key in filters) {
      let filter;
      try {
        // Попытка получить фильтр из контейнера зависимостей.
        filter = Ctr.ctr.get(filters[key]);
      } catch (e) {
        // В случае ошибки, создаем новый экземпляр фильтра.
        filter = await Ctr.ctr.create(filters[key]);
      }
      // Сохранение фильтра в результате.
      result[key] = filter;
    }

    return result;
  }

  private async parseGrants(): Promise<object> {
    // Проверка наличия кэша и попытка получить данные из кэша.
    if (this.cache) {
      const cache = await this.getFromCache();
      if (cache) {
        return cache;
      }
    }

    // Получение данных о правах доступа (grants) и разрешениях из хранилища RBAC.
    const { grants, permissions } = await this.rbac.getRbac();
    const result = {};

    // Обработка каждой роли и её прав доступа.
    Object.keys(grants).forEach((key) => {
      const grant = grants[key];

      // Удаление дубликатов и фильтрация прав доступа для каждой роли.
      result[key] = [
        ...new Set(grant.filter((value: string) => !value.startsWith('&'))),
      ].filter((value: string) => {
        if (value.includes('@')) {
          const split = value.split('@');
          return (
            permissions[split[0]] &&
            permissions[split[0]].some((inAction) => inAction === split[1])
          );
        }
        return !!permissions[value];
      });
    });

    // Обработка расширенных прав доступа.
    const findExtendedGrants = {};
    Object.keys(grants).forEach((key) => {
      const grant = grants[key];

      findExtendedGrants[key] = [
        ...new Set(
          grant
            .filter(
              (value: string) =>
                value.startsWith('&') &&
                grants[value.substr(1)] &&
                value.substr(1) !== key,
            )
            .map((value) => value.substr(1)),
        ),
      ];
    });

    // Объединение основных и расширенных прав доступа.
    Object.keys(findExtendedGrants).forEach((key) => {
      const grant = findExtendedGrants[key];
      grant.forEach((value) => {
        result[key] = [...new Set([...result[key], ...result[value]])];
      });
    });

    // Добавление разрешений, связанных с действиями, к каждой роли.
    Object.keys(result).forEach((key) => {
      const grant = result[key];
      const per = [];
      grant.forEach((value) => {
        if (!value.includes('@')) {
          per.push(...permissions[value].map((dd) => `${value}@${dd}`));
        }
      });
      result[key] = [...new Set([...result[key], ...per])];
    });

    // Сохранение обработанных данных в кэш, если он доступен.
    if (this.cache) {
      this.setIntoCache(result);
    }

    return result;
  }

  // Приватный метод для получения данных из кэша.
  private async getFromCache(): Promise<object | null> {
    // Вызывает метод get у объекта кэша для получения данных.
    // Если в кэше нет данных, возвращает null.
    return this.cache.get();
  }

  // Приватный метод для сохранения данных в кэш.
  private async setIntoCache(value: object): Promise<void> {
    // Вызывает метод set у объекта кэша для сохранения предоставленных данных.
    await this.cache.set(value);
  }
}
