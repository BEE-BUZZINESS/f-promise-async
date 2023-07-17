import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { sleep, someAsync } from '../../lib/misc';

chai.use(chaiAsPromised as any);
const assert = chai.assert;

describe('> someAsync', () => {

    it('> should be correctly typed for generics', async () => {
        async function testGenerics<T>(array: T[]): Promise<boolean> {
            return someAsync(array, async () => true);
        }
        await testGenerics<number>([1, 2, 3]);
    });

    it('> should return true when predicate find a match', async () => {
        let nbLoop = 0;
        assert.deepEqual(await someAsync([1, 2, 3], async val => {
            nbLoop++;
            return val === 2;
        }), true);
        assert.equal(nbLoop, 2);
    });

    it('> should return false when no predicate match', async () => {
        let nbLoop = 0;
        assert.deepEqual(await someAsync([1, 2, 3], async val => {
            nbLoop++;
            return val === 4;
        }), false);
        assert.equal(nbLoop, 3);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(someAsync([1, 2, 3], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return true when predicate find a match on Promise of array', async () => {
        let nbLoop = 0;
        assert.deepEqual(await someAsync(Promise.resolve([1, 2, 3]), async val => {
            nbLoop++;
            return val === 2;
        }), true);
        assert.equal(nbLoop, 2);
    });

    it('> should return false when no predicate match on Promise of array', async () => {
        let nbLoop = 0;
        assert.deepEqual(await someAsync(Promise.resolve([1, 2, 3]), async val => {
            nbLoop++;
            return val === 4;
        }), false);
        assert.equal(nbLoop, 3);
    });

    it('> should reject if an error occurs on Promise of array', async () => {
        await assert.isRejected(someAsync(Promise.resolve([1, 2, 3]), async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return true when predicate find a match on array of Promises', async () => {
        let nbLoop = 0;
        assert.deepEqual(await someAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            nbLoop++;
            return val === 2;
        }), true);
        assert.equal(nbLoop, 2);
    });

    it('> should return false when no predicate match on array of Promises', async () => {
        let nbLoop = 0;
        assert.deepEqual(await someAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            nbLoop++;
            return val === 4;
        }), false);
        assert.equal(nbLoop, 3);
    });

    it('> should reject if an error occurs on array of Promises', async () => {
        await assert.isRejected(someAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return true when predicate find a match on Promise of array of Promises', async () => {
        let nbLoop = 0;
        assert.deepEqual(await someAsync(Promise.resolve([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]), async val => {
            nbLoop++;
            return val === 2;
        }), true);
        assert.equal(nbLoop, 2);
    });

    it('> should return false when no predicate match on Promise of array of Promises', async () => {
        let nbLoop = 0;
        assert.deepEqual(await someAsync(Promise.resolve([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]), async val => {
            nbLoop++;
            return val === 4;
        }), false);
        assert.equal(nbLoop, 3);
    });

    it('> should reject if an error occurs on array Promise of of Promises', async () => {
        await assert.isRejected(someAsync(Promise.resolve([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]), async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should accept undefined as argument despite type', async () => {
        let nbLoop = 0;
        assert.isFalse(await someAsync(undefined as unknown as [], async () => {
            await sleep(1);
            nbLoop++;
            return true;
        }));
        assert.equal(nbLoop, 0);
    });

    it('> should accept null as argument despite type', async () => {
        let nbLoop = 0;
        assert.isFalse(await someAsync(null as unknown as [], async () => {
            await sleep(1);
            nbLoop++;
            return true;
        }));
        assert.equal(nbLoop, 0);
    });
});
