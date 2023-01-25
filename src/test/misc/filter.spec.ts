import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { filterAsync, sleep } from '../../lib/misc';

chai.use(chaiAsPromised as any);
const assert = chai.assert;

describe('> filterAsync', () => {

    it('> should return values in correct order', async () => {
        const arr: number[] = [];
        assert.deepEqual(await filterAsync([1, 2, 3], async val => {
            if (val === 1) await sleep(10);
            arr.push(val);
            return val !== 2;
        }), [1, 3]);
        assert.deepEqual(arr, [2, 3, 1]);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(filterAsync([1, 2, 3], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return values in correct order when mapping on Promise of array', async () => {
        const arr: number[] = [];
        assert.deepEqual(await filterAsync(Promise.resolve([1, 2, 3]), async val => {
            if (val === 1) await sleep(10);
            arr.push(val);
            return val !== 2;
        }), [1, 3]);
        assert.deepEqual(arr, [2, 3, 1]);
    });

    it('> should reject if an error occurs when mapping on Promise of array', async () => {
        await assert.isRejected(filterAsync(Promise.resolve([1, 2, 3]), async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should return values in correct order when mapping on array of Promises', async () => {
        const arr: number[] = [];
        assert.deepEqual(await filterAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            if (val === 1) await sleep(10);
            arr.push(val);
            return val !== 2;
        }), [1, 3]);
        assert.deepEqual(arr, [2, 3, 1]);
    });

    it('> should reject if an error occurs when mapping on array of Promises', async () => {
        await assert.isRejected(filterAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });
});
