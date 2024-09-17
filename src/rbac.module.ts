import {
  DynamicModule,
  Global,
  Module,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { RbacService } from './services/rbac.service';
import { ModuleRef, Reflector } from '@nestjs/core';
import { StorageRbacService } from './services/storage.rbac.service';
import { IStorageRbac } from './interfaces/storage.rbac.interface';
import { IDynamicStorageRbac } from './interfaces/dynamic.storage.rbac.interface';
import { ICacheRBAC } from './interfaces/cache.rbac.interface';
import { Ctr } from './ctr/ctr';

// Декоратор Global, делающий модуль глобальным.
// Глобальные модули могут быть импортированы в любом другом модуле без необходимости явного их указания в массиве imports.
@Global()
@Module({
  // providers - это массив провайдеров, которые будут инстанцированы Nest'ом и могут быть доступны
  // для внедрения зависимостей (Dependency Injection) в другие классы.
  providers: [
    RbacService, // Сервис для управления RBAC.
    StorageRbacService, // Сервис для работы с хранилищем данных RBAC.
    Reflector, // Встроенный в NestJS сервис для работы с метаданными.
  ],
  // imports - массив модулей, необходимых для данного модуля.
  // В данном случае, массив пуст, так как модуль не зависит от других модулей.
  imports: [],
  // exports - массив провайдеров, которые будут доступны для использования в других модулях,
  // которые импортируют данный модуль.
  exports: [
    RbacService, // Экспорт RbacService, делая его доступным в других модулях.
  ],
})
export class RBAcModule implements OnApplicationBootstrap {
  private static cache?: any | ICacheRBAC;
  private static cacheOptions?: { KEY?: string; TTL?: number };

  constructor(private readonly moduleRef: ModuleRef) {}

  // Статический метод useCache предназначен для настройки кэша, который может использоваться модулем RBAC.
  static useCache(
    // Аргумент 'cache' - это экземпляр кэша или объект, соответствующий интерфейсу ICacheRBAC.
    // Этот объект будет использоваться для кэширования данных RBAC, например, прав доступа или ролей.
    cache: any | ICacheRBAC,

    // Аргумент 'options' - необязательный параметр, содержащий настройки кэша.
    // KEY - это строковый ключ, который может использоваться для идентификации данных в кэше.
    // TTL - это время жизни кэша в секундах. Это означает, как долго данные должны храниться в кэше, прежде чем они устареют.
    options?: {
      KEY?: string;
      TTL?: number;
    },
  ) {
    // Присваивание предоставленного кэша статическому свойству 'cache' класса RBAcModule.
    RBAcModule.cache = cache;
    // Присваивание настроек кэша статическому свойству 'cacheOptions' класса RBAcModule.
    RBAcModule.cacheOptions = options;

    // Возврат класса RBAcModule. Это позволяет использовать цепочку вызовов при настройке модуля.
    return RBAcModule;
  }

  // Статический метод forRoot, используемый для настройки и инициализации RBAcModule в корневом модуле приложения.
  static forRoot(
    // Параметр rbac - объект, соответствующий интерфейсу IStorageRbac, содержащий данные о ролях, разрешениях и т.д.
    rbac: IStorageRbac,

    // Параметр providers - необязательный массив провайдеров, которые будут доступны в модуле.
    providers?: any[],

    // Параметр imports - необязательный массив модулей, которые должны быть импортированы в RBAcModule.
    imports?: any[],
  ): DynamicModule {
    // Метод возвращает DynamicModule, используя внутренний метод forDynamic.
    return RBAcModule.forDynamic(
      // Создается анонимный класс, который реализует интерфейс IDynamicStorageRbac.
      // Этот класс содержит метод getRbac, который возвращает переданный объект rbac.
      class {
        async getRbac(): Promise<IStorageRbac> {
          return rbac;
        }
      },
      // Передаются дополнительные параметры провайдеров и импортов.
      providers,
      imports,
    );
  }

  // Статический метод forDynamic для создания динамического модуля.
  static forDynamic<T extends new (...args: any[]) => IDynamicStorageRbac>(
    // rbac - класс, реализующий интерфейс IDynamicStorageRbac.
    rbac: T,

    // providers - необязательный массив дополнительных провайдеров для модуля.
    providers?: any[],

    // imports - необязательный массив модулей, которые должны быть импортированы в данный модуль.
    imports?: any[],
  ): DynamicModule {
    // Список зависимостей, которые будут внедрены.
    const inject = [rbac];

    // Общие провайдеры для модуля.
    const commonProviders = [];

    // Условие для добавления кэша, если он был настроен с помощью метода useCache.
    if (RBAcModule.cache) {
      // Добавление кэша в провайдеры.
      commonProviders.push(RBAcModule.cache, {
        provide: 'ICacheRBAC',
        // Фабрика для создания кэша с учетом опций, заданных в useCache.
        useFactory: (cache: ICacheRBAC): ICacheRBAC => {
          return RBAcModule.setCacheOptions(cache);
        },
        // Внедрение зависимости кэша.
        inject: [RBAcModule.cache],
      });
      // Добавление кэша в список зависимостей.
      inject.push(RBAcModule.cache);
    }

    // Добавление пользовательских провайдеров и класса rbac в общие провайдеры.
    commonProviders.push(
      ...[
        ...(providers || []),
        rbac,
        // Конфигурация StorageRbacService с использованием фабрики.
        {
          provide: StorageRbacService,
          useFactory: async (
            rbacService: IDynamicStorageRbac,
            cache?: ICacheRBAC,
          ) => {
            return new StorageRbacService(
              rbacService,
              RBAcModule.setCacheOptions(cache),
            );
          },
          // Внедрение зависимостей в StorageRbacService.
          inject,
        },
      ],
    );

    // Возвращение конфигурации динамического модуля.
    return {
      module: RBAcModule, // Указание текущего модуля.
      providers: commonProviders, // Набор провайдеров модуля.
      imports: [...(imports || [])], // Импорты для модуля.
    };
  }

  // Приватный статический метод для настройки параметров кэша.
  private static setCacheOptions(cache?: ICacheRBAC) {
    // Проверка, существует ли экземпляр кэша и настроены ли опции кэша.
    if (!cache || !RBAcModule.cacheOptions) {
      // Если кэш не существует или опции кэша не заданы, возвращаем текущий экземпляр кэша без изменений.
      return cache;
    }

    // Установка пользовательского ключа KEY для кэша, если он был предоставлен в опциях.
    if (RBAcModule.cacheOptions.KEY) {
      cache.KEY = RBAcModule.cacheOptions.KEY;
    }

    // Установка времени жизни кэша TTL, если оно было предоставлено в опциях.
    if (RBAcModule.cacheOptions.TTL) {
      cache.TTL = RBAcModule.cacheOptions.TTL;
    }

    // Возвращение экземпляра кэша с примененными настройками.
    return cache;
  }

  // Метод, вызываемый NestJS при инициализации приложения.
  onApplicationBootstrap(): any {
    // Присваивание экземпляра ModuleRef статическому свойству ctr класса Ctr.
    // ModuleRef используется для управления зависимостями в NestJS.
    Ctr.ctr = this.moduleRef;
  }
}
