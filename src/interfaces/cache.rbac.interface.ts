// Определение интерфейса ICacheRBAC.
export interface ICacheRBAC {
    // Свойство KEY, представляющее ключ кэша. Ожидается, что это будет строка.
    KEY: string;

    // Свойство TTL (Time To Live), определяющее время жизни кэша в секундах. Это число.
    TTL: number;

    // Метод get для получения данных из кэша.
    // Он должен возвращать объект или null, если данные по ключу отсутствуют.
    get(): object | null;

    // Метод set для установки или обновления данных в кэше.
    // Принимает значение value типа object, которое будет сохранено в кэше.
    set(value: object): void;

    // Метод del для удаления данных из кэша.
    del(): void;
}
