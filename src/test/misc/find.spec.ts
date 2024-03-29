import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { findAsync, sleep } from '../../lib/misc';

chai.use(chaiAsPromised as any);
const assert = chai.assert;

describe('> findAsync', () => {

    it('> should be correctly typed for generics', async () => {
        async function testGenerics<T>(array: T[]): Promise<T | undefined> {
            return findAsync(array, async val => !!val);
        }
        await testGenerics([1, 2, 3]);
    });

    it('> should return first matching value', async () => {
        let nbLoops = 0;
        assert.deepEqual(await findAsync([1, 2, 3], async val => {
            nbLoops++;
            return val > 1;
        }), 2);
        assert.equal(nbLoops, 2);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(findAsync([1, 2, 3], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return first matching value on Promise of array', async () => {
        let nbLoops = 0;
        assert.deepEqual(await findAsync(Promise.resolve([1, 2, 3]), async val => {
            nbLoops++;
            return val > 1;
        }), 2);
        assert.equal(nbLoops, 2);
    });

    it('> should reject if an error occurs when mapping on Promise of array', async () => {
        await assert.isRejected(findAsync(Promise.resolve([1, 2, 3]), async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return first matching value on array of Promises', async () => {
        let nbLoops = 0;
        assert.deepEqual(await findAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            nbLoops++;
            if (val === 1) await sleep(10);
            return val > 1;
        }), 2);
        assert.equal(nbLoops, 2);
    });

    it('> should reject if an error occurs when mapping on array of Promises', async () => {
        await assert.isRejected(findAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return first matching value on Promise of array of Promises', async () => {
        let nbLoops = 0;
        assert.deepEqual(await findAsync(Promise.resolve([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]), async val => {
            nbLoops++;
            if (val === 1) await sleep(10);
            return val > 1;
        }), 2);
        assert.equal(nbLoops, 2);
    });

    it('> should reject if an error occurs when mapping on Promise of array of Promises', async () => {
        await assert.isRejected(findAsync(Promise.resolve([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]), async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should accept undefined as argument despite type', async () => {
        let nbLoop = 0;
        assert.isUndefined(await findAsync(undefined as unknown as [], async () => {
            await sleep(1);
            nbLoop++;
            return true;
        }));
        assert.equal(nbLoop, 0);
    });

    it('> should accept null as argument despite type', async () => {
        let nbLoop = 0;
        assert.isUndefined(await findAsync(null as unknown as [], async () => {
            await sleep(1);
            nbLoop++;
            return true;
        }));
        assert.equal(nbLoop, 0);
    });
});
