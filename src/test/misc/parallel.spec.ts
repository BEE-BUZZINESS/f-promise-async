import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { parallelAsync } from '../../lib/misc/parallel';
import { sleep } from '../../lib/misc/timer';

chai.use(chaiAsPromised as any);
const assert = chai.assert;

describe('> parallelAsync', () => {
    it('> should execute function with same return types concurrently', async () => {
        const beginDate = Date.now();
        const res = await parallelAsync(
            async () => {
                await sleep(5);
                return 1;
            },
            async () => {
                await sleep(5);
                return 2;
            },
        );
        assert.isBelow(Date.now() - beginDate, 8);
        assert.deepEqual(res, [1, 2]);
    });

    it('> should execute function with different return types concurrently', async () => {
        const beginDate = Date.now();
        const res = await parallelAsync(
            async () => {
                await sleep(5);
                return true;
            },
            async () => {
                await sleep(5);
                return 2;
            },
            async () => {
                await sleep(5);
                return [];
            },
        );
        assert.isBelow(Date.now() - beginDate, 8);
        assert.deepEqual(res, [true, 2, []]);
    });

    it('> should stop execution on first throw', async () => {
        let res1 = null;
        let res3 = null;

        const beginDate = Date.now();
        const e = await assert.isRejected(parallelAsync(
            async () => {
                await sleep(3);
                return res1 = 1;
            },
            async () => {
                await sleep(8);
                throw new Error('unexpected error');
            },
            async () => {
                await sleep(15);
                return res3 = 3;
            },
        )) as unknown as Error;
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'unexpected error');
        assert.isBelow(Date.now() - beginDate, 10);
        assert.equal(res1, 1);
        assert.isNull(res3);
    });
});