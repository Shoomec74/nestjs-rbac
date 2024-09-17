import { IParamsFilter } from './interfaces/params.filter.interface';

// Определение класса ParamsFilter, который реализует интерфейс IParamsFilter.
export class ParamsFilter implements IParamsFilter {
    // Хранилище для фильтров и их параметров.
    // Используется объект для хранения пар ключ-значение, где ключом является строка filter,
    // а значением - массив параметров.
    private storage: object = {};

    // Метод для получения параметров фильтра.
    // Возвращает значение параметра для заданного фильтра.
    // Если для фильтра не установлены параметры, возвращает undefined.
    getParam(filter: string): any {
        return this.storage[filter];
    }

    // Метод для установки параметров фильтра.
    // Принимает строку filter и произвольное количество параметров.
    // Сохраняет параметры в хранилище и возвращает ссылку на текущий экземпляр класса,
    // позволяя использовать цепочку вызовов (method chaining).
    setParam(filter: string, ...params: any[]): IParamsFilter {
        this.storage[filter] = params;
        return this;
    }
}
