import * as chai from 'chai';
import 'mocha';

import { Repository } from 'typeorm';

const expect = chai.expect;

/**
 * First saves the given entity to the database, then finds it and makes sure
 * that the found entity is exactly equal to the original one. This is a bare
 * minimum basic test to make sure that the entity type definition and our
 * database schema are aligned and that it is possible to save and find the
 * entity.
 * @param repository A TypeORM repository corresponding with the type of the entity.
 * @param entity An instance of a TypeORM entity which will be saved/retrieved from the database.
 */
export async function testSaveAndFindEntityAsync<T>(repository: Repository<T>, entity: T): Promise<void> {
    await repository.save<any>(entity);
    const gotEntity = await repository.findOneOrFail({
        where: entity,
    });
    expect(gotEntity).deep.equal(entity);
}
