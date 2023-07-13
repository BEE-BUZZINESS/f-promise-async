import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { flatMapAsync, map, mapAsync, mapObjectAsync, sleep } from '../../lib/misc';

chai.use(chaiAsPromised as any);
const assert = chai.assert;

describe('> map', () => {

    it('> should return values in correct order', async () => {
        const arr: number[] = [];
        assert.deepEqual(await map([2, 5], async val => {
            if (val === 2) await sleep(10);
            arr.push(val);
            return val;
        }), [2, 5]);
        assert.deepEqual(arr, [5, 2]);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(map([2, 5], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 2');
    });

});

describe('> mapAsync', () => {

    it('> should return values in correct order', async () => {
        const arr: number[] = [];
        assert.deepEqual(await mapAsync([2, 3, 5], async (val, index) => {
            if (val === 2) await sleep(10);
            arr.push(val);
            return val * index;
        }), [0, 3, 10]);
        assert.deepEqual(arr, [3, 5, 2]);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(mapAsync([2, 3, 5], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 2');
    });

    it('> should return values in correct order when mapping on Promise of array', async () => {
        const arr: number[] = [];
        assert.deepEqual(await mapAsync(Promise.resolve([2, 3, 5]), async (val, index) => {
            if (val === 2) await sleep(10);
            arr.push(val);
            return val * index;
        }), [0, 3, 10]);
        assert.deepEqual(arr, [3, 5, 2]);
    });

    it('> should reject if an error occurs when mapping on Promise of array', async () => {
        await assert.isRejected(mapAsync(Promise.resolve([2, 3, 5]), async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 2');
    });

    it('> should return values in correct order when mapping on array of Promises', async () => {
        const arr: number[] = [];
        assert.deepEqual(await mapAsync([Promise.resolve(2), Promise.resolve(3), Promise.resolve(5)], async (val, index) => {
            if (val === 2) await sleep(10);
            arr.push(val);
            return val * index;
        }), [0, 3, 10]);
        assert.deepEqual(arr, [3, 5, 2]);
    });

    it('> should reject if an error occurs when mapping on array of Promises', async () => {
        await assert.isRejected(mapAsync([Promise.resolve(2), Promise.resolve(5)], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 2');
    });

    it('> should accept undefined as argument despite type', async () => {
        let nbLoop = 0;
        assert.isEmpty(await mapAsync(undefined as unknown as [], async () => {
            await sleep(1);
            nbLoop++;
            return true;
        }));
        assert.equal(nbLoop, 0);
    });

    it('> should accept null as argument despite type', async () => {
        let nbLoop = 0;
        assert.isEmpty(await mapAsync(null as unknown as [], async () => {
            await sleep(1);
            nbLoop++;
            return true;
        }));
        assert.equal(nbLoop, 0);
    });

    describe('> limit concurrency', () => {

        it('> should return values in correct order with concurrency 1', async () => {
            const arr: number[] = [];
            assert.deepEqual(await mapAsync([2, 3, 5], async (val, index) => {
                if (val === 2) await sleep(10);
                arr.push(val);
                return val * index;
            }, { concurrency: 1 }), [0, 3, 10]);
            assert.deepEqual(arr, [2, 3, 5]);
        });

        it('> should return values in correct order with concurrency 2', async () => {
            const arr: number[] = [];
            const beginDate = Date.now();
            assert.deepEqual(await mapAsync(Promise.resolve(new Array(8)), async (val, index) => {
                if (index % 2 === 0) await sleep(10);
                arr.push(index);
                return index;
            }, { concurrency: 2 }), [0, 1, 2, 3, 4, 5, 6, 7]);
            assert.notDeepEqual(arr, [0, 1, 2, 3, 4, 5, 6, 7]);
            assert.isBelow(Date.now() - beginDate, 25); // 4 sleep with 2 concurrently, theoretically 20ms
        });

        it('> should return values in correct order with concurrency 3', async () => {
            const arr: number[] = [];
            const beginDate = Date.now();
            assert.deepEqual(await mapAsync(new Array(9).map(() => Promise.resolve()), async (val, index) => {
                if (index % 3 === 0) await sleep(10);
                arr.push(index);
                return index;
            }, { concurrency: 3 }), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
            assert.notDeepEqual(arr, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
            assert.isBelow(Date.now() - beginDate, 15); // 3 sleep with 3 concurrently, theoretically 10ms
        });
    });
});

describe('> flatMapAsync', () => {

    it('> should return flat values in correct order', async () => {
        const arr: number[] = [];
        assert.deepEqual(await flatMapAsync([[2, 3], [5]], async val => {
            if (val[0] === 2) await sleep(10);
            val.forEach((v: number) => arr.push(v));
            return val;
        }), [2, 3, 5]);
        assert.deepEqual(arr, [5, 2, 3]);
    });

    it('> should return flat values in correct order with concurrency 1', async () => {
        const arr: number[] = [];
        assert.deepEqual(await flatMapAsync([[2, 3], [5]], async val => {
            if (val[0] === 2) await sleep(10);
            val.forEach((v: number) => arr.push(v));
            return val;
        }, { concurrency: 1}), [2, 3, 5]);
        assert.deepEqual(arr, [2, 3, 5]);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(flatMapAsync([[2, 3], [5]], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 2');
    });

    it('> should return flat values in correct order when mapping on Promise of array', async () => {
        const arr: number[] = [];
        assert.deepEqual(await flatMapAsync(Promise.resolve([[2, 3], [5]]), async (val, index) => {
            if (val[0] === 2) await sleep(10);
            val.forEach((v: number) => arr.push(v));
            return val;
        }), [2, 3, 5]);
        assert.deepEqual(arr, [5, 2, 3]);
    });

    it('> should reject if an error occurs when mapping on Promise of array', async () => {
        await assert.isRejected(flatMapAsync(Promise.resolve([[2, 3], [5]]), async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 2');
    });

    it('> should return flat values in correct order when mapping on array of Promises', async () => {
        const arr: number[] = [];
        assert.deepEqual(await flatMapAsync([Promise.resolve([2, 3]), Promise.resolve([5])], async val => {
            if (val[0] === 2) await sleep(10);
            val.forEach((v: number) => arr.push(v));
            return val;
        }), [2, 3, 5]);
        assert.deepEqual(arr, [5, 2, 3]);
    });

    it('> should reject if an error occurs when mapping on array of Promises', async () => {
        await assert.isRejected(flatMapAsync([Promise.resolve([2, 3]), Promise.resolve([5])], async val => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 2');
    });

    it('> should accept undefined as argument despite type', async () => {
        let nbLoop = 0;
        assert.isEmpty(await flatMapAsync(undefined as unknown as [], async () => {
            await sleep(1);
            nbLoop++;
            return true;
        }));
        assert.equal(nbLoop, 0);
    });

    it('> should accept null as argument despite type', async () => {
        let nbLoop = 0;
        assert.isEmpty(await flatMapAsync(null as unknown as [], async () => {
            await sleep(1);
            nbLoop++;
            return true;
        }));
        assert.equal(nbLoop, 0);
    });
});

describe('> mapObjectAsync', () => {

    it('> should return values in correct order', async () => {
        assert.deepEqual(await mapObjectAsync({ a: 2, b: 5 }, async (val, key) => {
            if (val === 2) await sleep(10);
            return val;
        }), [2, 5]);
    });

    it('> should return values in correct order with concurrency 1', async () => {
        const arr: number[] = [];
        assert.deepEqual(await mapObjectAsync({ a: 2, b: 3, c: 5 }, async (val, key) => {
            if (val === 2) await sleep(10);
            arr.push(val);
            return val;
        }, { concurrency: 1 }), [2, 3, 5]);
        assert.deepEqual(arr, [2, 3, 5]);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(mapObjectAsync({ a: 2, b: 5 }, async (val, key) => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 2');
    });
});
