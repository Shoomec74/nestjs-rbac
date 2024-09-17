import { IRoleRbac } from '../../role/interfaces/role.rbac.interface';
import { IParamsFilter } from '../../params-filter/interfaces/params.filter.interface';

// Определение интерфейса IRbac.
export interface IRbac {
    // Метод getRole предназначен для получения объекта, реализующего интерфейс IRoleRbac,
    // который представляет специфическую роль в системе RBAC.
    // 
    // Параметры:
    //   role: string - Имя роли, для которой необходимо получить объект IRoleRbac.
    //   builderFilter?: IParamsFilter - Опциональный параметр, который позволяет передать
    //                                   фильтр параметров, используемый для дополнительной
    //                                   настройки или ограничения поведения получаемой роли.
    //
    // Возвращает Promise, который разрешается в объект IRoleRbac, соответствующий указанной роли.
    getRole(role: string, builderFilter?: IParamsFilter): Promise<IRoleRbac>;
}

