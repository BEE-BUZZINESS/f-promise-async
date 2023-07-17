import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { sleep } from '../../lib/misc';
import { eachAsync } from '../../lib/misc/each';

chai.use(chaiAsPromised as any);
const assert = chai.assert;

describe('> eachAsync', () => {

    it('> should be correctly typed for generics', async () => {
        async function testGenerics<T>(array: T[]): Promise<void> {
            await eachAsync(array, async () => undefined);
        }
        await testGenerics<number>([1, 2, 3]);
    });

    it('> should iterate with all elements on Promise of array', async () => {
        let nbLoop = 0;
        await eachAsync([1, 2, 3], async (val, index) => {
            if (val === 2) await sleep(1);
            assert.equal(index, nbLoop);
            assert.equal(val -1, index);
            nbLoop++;
        });
        assert.equal(nbLoop, 3);
    });

    it('> should stop iterate if function return true', async () => {
        let nbLoop = 0;
        await eachAsync([1, 2, 3], async val => {
            await sleep(1);
            nbLoop++;
            return val === 2;
        });
        assert.equal(nbLoop, 2);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(eachAsync([1, 2, 3], async val => {
            await sleep(1);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should iterate with all elements on Promise of array', async () => {
        let nbLoop = 0;
        await eachAsync(Promise.resolve([1, 2, 3]), async (val, index) => {
            if (val === 2) await sleep(1);
            assert.equal(index, nbLoop);
            assert.equal(val -1, index);
            nbLoop++;
        });
        assert.equal(nbLoop, 3);
    });

    it('> should stop iterate if function return true on Promise of array', async () => {
        let nbLoop = 0;
        await eachAsync(Promise.resolve([1, 2, 3]), async val => {
            await sleep(1);
            nbLoop++;
            return val === 2;
        });
        assert.equal(nbLoop, 2);
    });

    it('> should reject if an error occurs on Promise of array', async () => {
        await assert.isRejected(eachAsync(Promise.resolve([1, 2, 3]), async val => {
            await sleep(1);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should iterate with all elements on array of Promises', async () => {
        let nbLoop = 0;
        await eachAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async (val, index) => {
            if (val === 2) await sleep(1);
            assert.equal(index, nbLoop);
            assert.equal(val -1, index);
            nbLoop++;
        });
        assert.equal(nbLoop, 3);
    });

    it('> should stop iterate if function return true on array of Promises', async () => {
        let nbLoop = 0;
        await eachAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            await sleep(1);
            nbLoop++;
            return val === 2;
        });
        assert.equal(nbLoop, 2);
    });

    it('> should reject if an error occurs on array of Promises', async () => {
        await assert.isRejected(eachAsync([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], async val => {
            await sleep(1);
            throw new Error(`err: ${val}`);
        }), 'err: 1');
    });

    it('> should accept undefined as argument despite type', async () => {
        let nbLoop = 0;
        await eachAsync(undefined as unknown as [], async val => {
            await sleep(1);
            nbLoop++;
        });
        assert.equal(nbLoop, 0);
    });

    it('> should accept null as argument despite type', async () => {
        let nbLoop = 0;
        await eachAsync(null as unknown as [], async val => {
            await sleep(1);
            nbLoop++;
        });
        assert.equal(nbLoop, 0);
    });
});
