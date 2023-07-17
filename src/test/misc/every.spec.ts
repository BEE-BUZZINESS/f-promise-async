import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { everyAsync, sleep } from '../../lib/misc';

chai.use(chaiAsPromised as any);
const assert = chai.assert;

describe('> everyAsync', () => {

    it('> should be correctly typed for generics', async () => {
        async function testGenerics<T>(array: T[]): Promise<boolean> {
            return everyAsync(array, async () => true);
        }
        await testGenerics<number>([1, 2, 3]);
    });

    it('> should return true when predicate match with all elements', async () => {
        let nbLoop = 0;
        assert.deepEqual(await everyAsync([1, 2, 3], async val => {
            nbLoop++;
            return val > 0;
        }), true);
        assert.equal(nbLoop, 3);
    });

    it('> should return false when predicate does not match with at least one element', async () => {
        let nbLoop = 0;
        assert.deepEqual(await everyAsync([1, 2, 3], async val => {
            nbLoop++;
            return val < 2;
        }), false);
        assert.equal(nbLoop, 2);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(everyAsync([1, 2, 3], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return true when predicate match with all elements on Promise of array', async () => {
        let nbLoop = 0;
        assert.deepEqual(await everyAsync(Promise.resolve([1, 2, 3]), async val => {
            nbLoop++;
            return val > 0;
        }), true);
        assert.equal(nbLoop, 3);
    });

    it('> should return false when does not match with at least one element on Promise of array', async () => {
        let nbLoop = 0;
        assert.deepEqual(await everyAsync(Promise.resolve([1, 2, 3]), async val => {
            nbLoop++;
            return val < 2;
        }), false);
        assert.equal(nbLoop, 2);
    });

    it('> should reject if an error occurs on Promise of array', async () => {
        await assert.isRejected(everyAsync(Promise.resolve([1, 2, 3]), async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return true when predicate match with all elements on array of Promises', async () => {
        let nbLoop = 0;
        assert.deepEqual(await everyAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            nbLoop++;
            return val > 0;
        }), true);
        assert.equal(nbLoop, 3);
    });

    it('> should return false when predicate does not match with at least one element on array of Promises', async () => {
        let nbLoop = 0;
        assert.deepEqual(await everyAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            nbLoop++;
            return val < 2;
        }), false);
        assert.equal(nbLoop, 2);
    });

    it('> should reject if an error occurs on array of Promises', async () => {
        await assert.isRejected(everyAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return true when predicate match with all elements on Promise of array of Promises', async () => {
        let nbLoop = 0;
        assert.deepEqual(await everyAsync(Promise.resolve([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]), async val => {
            nbLoop++;
            return val > 0;
        }), true);
        assert.equal(nbLoop, 3);
    });

    it('> should return false when predicate does not match with at least one element on Promise of array of Promises', async () => {
        let nbLoop = 0;
        assert.deepEqual(await everyAsync(Promise.resolve([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]), async val => {
            nbLoop++;
            return val < 2;
        }), false);
        assert.equal(nbLoop, 2);
    });

    it('> should reject if an error occurs on Promise of array of Promises', async () => {
        await assert.isRejected(everyAsync(Promise.resolve([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]), async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should accept undefined as argument despite type', async () => {
        let nbLoop = 0;
        assert.isTrue(await everyAsync(undefined as unknown as [], async () => {
            await sleep(1);
            nbLoop++;
            return true;
        }));
        assert.equal(nbLoop, 0);
    });

    it('> should accept null as argument despite type', async () => {
        let nbLoop = 0;
        assert.isTrue(await everyAsync(null as unknown as [], async () => {
            await sleep(1);
            nbLoop++;
            return true;
        }));
        assert.equal(nbLoop, 0);
    });
});
