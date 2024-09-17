import { Injectable } from '@nestjs/common';
import { ICacheRBAC } from '../interfaces/cache.rbac.interface';
import * as  NodeCache from 'node-cache';

// Используем декоратор @Injectable, который делает класс доступным для внедрения зависимостей в другие классы.
@Injectable()
export class RbacCache implements ICacheRBAC {
    // Объявляем константу KEY, которая будет ключом для доступа к данным в кэше.
    KEY = 'RBAC';
    
    // Объявляем константу TTL (Time To Live) для установки времени жизни кэша. Значение 0 означает, что кэш не истекает.
    TTL = 0;

    // Объявляем переменную cache, которая будет хранить экземпляр NodeCache.
    private readonly cache;

    // Конструктор класса, который инициализирует переменную cache.
    constructor() {
        // Создаем новый экземпляр NodeCache и присваиваем его переменной cache.
        this.cache = new NodeCache();
    }

    // Метод get для получения данных из кэша.
    get(): object | null {
        // Возвращаем данные из кэша по ключу KEY. Если данных нет, возвращается null.
        return this.cache.get(this.KEY);
    }

    // Метод set для добавления или обновления данных в кэше.
    set(value: object): void {
        // Устанавливаем значение value в кэш по ключу KEY. TTL определяет время жизни кэша.
        this.cache.set(this.KEY, value, this.TTL);
    }

    // Метод del для удаления данных из кэша.
    del(): void {
        // Удаляем данные из кэша по ключу KEY.
        this.cache.del(this.KEY);
    }
}

