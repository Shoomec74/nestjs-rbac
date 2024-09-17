import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../services/rbac.service';
import { IRole } from '../role/interfaces/role.interface';
import { ParamsFilter } from '../params-filter/params.filter';
import { ASYNC_RBAC_REQUEST_FILTER, RBAC_REQUEST_FILTER } from '../constans';
import {
  RBAcAnyAsyncPermissions,
  RBAcAnyPermissions,
  RBAcAsyncPermissions,
  RBAcPermissions,
} from '../decorators/rbac.permissions.decorator';

@Injectable()
export class RBAcGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  // Метод canActivate проверяет, имеет ли пользователь необходимые разрешения для доступа к определенному маршруту.
  async canActivate(
    context: ExecutionContext, // Принимает контекст выполнения, который предоставляет детали о текущем запросе.
  ): Promise<boolean> {
    // Получаем объект запроса из контекста. Это позволяет нам работать с данными HTTP-запроса.
    const request = context.switchToHttp().getRequest();

    // Извлекаем информацию о пользователе из запроса. Предполагается, что пользователь и его роль уже определены.
    const user: IRole = request.user;

    // Если информация о пользователе отсутствует, прерываем выполнение и выбрасываем исключение ForbiddenException.
    if (!user) {
      throw new ForbiddenException('Getting user was failed.');
    }

    // Проверяем наличие асинхронных разрешений.
    {
      const permAsync = this.rbacAsync(context);
      if (permAsync.length > 0) {
        const filter = new ParamsFilter();
        // Устанавливаем параметры фильтрации для запроса.
        filter.setParam(ASYNC_RBAC_REQUEST_FILTER, { ...request });
        // Проверяем, имеет ли пользователь асинхронные разрешения. Если да, возвращаем true.
        return (await this.rbacService.getRole(user.role, filter)).canAsync(
          ...permAsync,
        );
      }
    }

    // Проверяем наличие синхронных разрешений.
    {
      const perm = this.rbac(context);
      if (perm.length > 0) {
        const filter = new ParamsFilter();
        filter.setParam(RBAC_REQUEST_FILTER, { ...request });
        // Проверяем, имеет ли пользователь синхронные разрешения. Если да, возвращаем true.
        return (await this.rbacService.getRole(user.role, filter)).can(...perm);
      }
    }

    // Проверяем наличие любых синхронных разрешений (хотя бы одного).
    {
      const permAny = this.rbacAny(context);
      if (permAny.length > 0) {
        const filter = new ParamsFilter();
        filter.setParam(RBAC_REQUEST_FILTER, { ...request });
        // Проверяем, имеет ли пользователь хотя бы одно из указанных синхронных разрешений.
        return (await this.rbacService.getRole(user.role, filter)).any(
          ...permAny,
        );
      }
    }

    // Проверяем наличие любых асинхронных разрешений (хотя бы одного).
    {
      const permAnyAsync = this.rbacAnyAsync(context);
      if (permAnyAsync.length > 0) {
        const filter = new ParamsFilter();
        filter.setParam(ASYNC_RBAC_REQUEST_FILTER, { ...request });
        // Проверяем, имеет ли пользователь хотя бы одно из указанных асинхронных разрешений.
        return await (
          await this.rbacService.getRole(user.role, filter)
        ).anyAsync(...permAnyAsync);
      }
    }

    // Если ни одно из условий не выполнено, пользователь не имеет разрешения на доступ, и мы выбрасываем исключение ForbiddenException.
    throw new ForbiddenException();
  }

  // Приватный метод rbacAsync используется для извлечения асинхронных разрешений из контекста выполнения.
  private rbacAsync(context: ExecutionContext): string[] {
    // Используем Reflector для получения метаданных асинхронных разрешений.
    // Метаданные могут быть установлены на уровне обработчика метода (getHandler) или на уровне класса (getClass).
    const permissions =
      this.reflector.get<string[]>(
        RBAcAsyncPermissions.name,
        context.getHandler(),
      ) ||
      this.reflector.get<string[]>(
        RBAcAsyncPermissions.name,
        context.getClass(),
      );

    // Если метаданные были найдены (то есть не undefined), возвращаем их.
    if (permissions !== undefined) {
      return permissions;
    }

    // Если метаданные не были найдены, возвращаем пустой массив.
    return [];
  }

  // Приватный метод rbac используется для получения синхронных разрешений из контекста выполнения.
  private rbac(context: ExecutionContext): string[] {
    // Используем Reflector для извлечения метаданных. Reflector - это служба NestJS, позволяющая работать с метаданными.
    // Здесь мы пытаемся получить метаданные для синхронных разрешений, которые могут быть установлены на уровне обработчика маршрута (метода) или на уровне класса.
    const permissions =
      this.reflector.get<string[]>(
        RBAcPermissions.name,
        context.getHandler(),
      ) ||
      this.reflector.get<string[]>(RBAcPermissions.name, context.getClass());

    // Если метаданные были найдены (не равны undefined), возвращаем их.
    // Эти метаданные представляют собой массив строк, где каждая строка - это идентификатор разрешения.
    if (permissions !== undefined) {
      return permissions;
    }

    // Если метаданные не были найдены (равны undefined), возвращаем пустой массив.
    // Это означает, что для данного контекста выполнения не установлены конкретные синхронные разрешения.
    return [];
  }

  // Приватный метод rbacAny используется для получения групп разрешений "любые из" из контекста выполнения.
  private rbacAny(context: ExecutionContext): string[][] {
    // Используем Reflector для извлечения метаданных. Reflector - это сервис NestJS для работы с метаданными.
    // Здесь мы пытаемся получить метаданные для групп разрешений "любые из", которые могут быть установлены на уровне обработчика маршрута (метода) или на уровне класса.
    const permissions =
      this.reflector.get<string[][]>(
        RBAcAnyPermissions.name,
        context.getHandler(),
      ) ||
      this.reflector.get<string[][]>(
        RBAcAnyPermissions.name,
        context.getClass(),
      );

    // Если метаданные были найдены (не равны undefined), возвращаем их.
    // Эти метаданные представляют собой массив массивов строк. Каждый внутренний массив - это группа разрешений,
    // и для предоставления доступа достаточно наличия хотя бы одного разрешения из группы.
    if (permissions !== undefined) {
      return permissions;
    }

    // Если метаданные не были найдены (равны undefined), возвращаем пустой массив.
    // Это означает, что для данного контекста выполнения не установлены конкретные группы разрешений "любые из".
    return [];
  }

  // Приватный метод rbacAnyAsync используется для получения групп асинхронных разрешений из контекста выполнения.
  private rbacAnyAsync(context: ExecutionContext): string[][] {
    // Используем Reflector для извлечения метаданных. Reflector - это сервис NestJS для работы с метаданными.
    // Здесь мы пытаемся получить метаданные для групп асинхронных разрешений "любые из", которые могут быть установлены на уровне обработчика маршрута (метода) или на уровне класса.
    const permissions =
      this.reflector.get<string[][]>(
        RBAcAnyAsyncPermissions.name,
        context.getHandler(),
      ) ||
      this.reflector.get<string[][]>(
        RBAcAnyAsyncPermissions.name,
        context.getClass(),
      );

    // Если метаданные были найдены (не равны undefined), возвращаем их.
    // Эти метаданные представляют собой массив массивов строк. Каждый внутренний массив - это группа асинхронных разрешений,
    // и для предоставления доступа достаточно наличия хотя бы одного разрешения из каждой группы.
    if (permissions !== undefined) {
      return permissions;
    }

    // Если метаданные не были найдены (равны undefined), возвращаем пустой массив.
    // Это означает, что для данного контекста выполнения не установлены конкретные группы асинхронных разрешений "любые из".
    return [];
  }
}
