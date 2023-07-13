import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { reduceAsync, sleep } from '../../lib/misc';

chai.use(chaiAsPromised as any);
const assert = chai.assert;

describe('> reduceAsync', () => {

    it('> should reduce value sequentially', async () => {
        const arr: number[] = [];
        assert.deepEqual(await reduceAsync([2, 3, 5], async (sum, val) => {
            if (val === 2) await sleep(10);
            arr.push(val);
            return sum + val;
        }, 100), 110);
        assert.deepEqual(arr, [2, 3, 5]);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(reduceAsync([2, 3, 5], async (sum, val) => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }, 0), 'err: 2');
    });

    it('> should reduce values in correct order when mapping on Promise of array', async () => {
        const arr: number[] = [];
        assert.deepEqual(await reduceAsync(Promise.resolve([2, 3, 5]), async (sum, val) => {
            if (val === 2) await sleep(10);
            arr.push(val);
            return sum + val;
        }, 100), 110);
        assert.deepEqual(arr, [2, 3, 5]);
    });

    it('> should reject if an error occurs when mapping on Promise of array', async () => {
        await assert.isRejected(reduceAsync(Promise.resolve([2, 3, 5]), async (sum, val) => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }, 0), 'err: 2');
    });

    it('> should return values in correct order when mapping on array of Promises', async () => {
        const arr: number[] = [];
        assert.deepEqual(await reduceAsync([Promise.resolve(2), Promise.resolve(3), Promise.resolve(5)], async (sum, val) => {
            if (val === 2) await sleep(10);
            arr.push(val);
            return sum + val;
        }, 100), 110);
        assert.deepEqual(arr, [2, 3, 5]);
    });

    it('> should reject if an error occurs when mapping on array of Promises', async () => {
        await assert.isRejected(reduceAsync([Promise.resolve(2), Promise.resolve(5)], async (sum, val) => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }, 0), 'err: 2');
    });

    it('> should return values in correct order when mapping on array of Promises', async () => {
        const arr: number[] = [];
        assert.deepEqual(await reduceAsync(Promise.resolve([Promise.resolve(2), Promise.resolve(3), Promise.resolve(5)]), async (sum, val) => {
            if (val === 2) await sleep(10);
            arr.push(val);
            return sum + val;
        }, 100), 110);
        assert.deepEqual(arr, [2, 3, 5]);
    });

    it('> should reject if an error occurs when mapping on array of Promises', async () => {
        await assert.isRejected(reduceAsync(Promise.resolve([Promise.resolve(2), Promise.resolve(5)]), async (sum, val) => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }, 0), 'err: 2');
    });

    it('> should accept undefined as argument despite type', async () => {
        let nbLoop = 0;
        assert.isTrue(await reduceAsync(undefined as unknown as [], async acc => {
            await sleep(1);
            nbLoop++;
            return acc;
        }, true));
        assert.equal(nbLoop, 0);
    });

    it('> should accept null as argument despite type', async () => {
        let nbLoop = 0;
        assert.isTrue(await reduceAsync(null as unknown as [], async acc => {
            await sleep(1);
            nbLoop++;
            return acc;
        }, true));
        assert.equal(nbLoop, 0);
    });
});
