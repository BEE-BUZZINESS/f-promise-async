import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { sleep, waitTimeout } from '../../lib/misc';

chai.use(chaiAsPromised as any);
const assert = chai.assert;

describe('> waitTimeout', () => {
    it('> should return the async callback return value if it ends before the timeout', async () => {
        const res = await waitTimeout(async () => {
            await sleep(3);
            return 4;
        }, 10);
        assert.equal(res, 4);
    });

    it('> should throw an error if callback is still running after the timeout', async () => {
        const beginDate = Date.now();
        const e = await assert.isRejected(waitTimeout(async () => {
            await sleep(5);
            return 4;
        }, 2)) as unknown as Error;
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'Timeout');
        assert.isBelow(Date.now() - beginDate, 5);
    });

    it('> should throw a given error if callback is still running after the timeout', async () => {
        const beginDate = Date.now();
        const error = new Error('Given error');
        const e = await assert.isRejected(waitTimeout(async () => {
            await sleep(5);
            return 4;
        }, 2, error)) as unknown as Error;
        assert.equal(e, error);
        assert.isBelow(Date.now() - beginDate, 5);
    });

    it('> should propagate callback error if any before the timeout', async () => {
        const beginDate = Date.now();
        const error = new Error('Business Error');
        const e = await assert.isRejected(waitTimeout(async () => {
            await sleep(2);
            throw error;
        }, 5)) as unknown as Error;
        assert.equal(e, error);
        assert.isBelow(Date.now() - beginDate, 5);
    });

    it('> should throw an error if promise is still running after the timeout', async () => {
        const beginDate = Date.now();
        const e = await assert.isRejected(waitTimeout(sleep(5), 2)) as unknown as Error;
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'Timeout');
        assert.isBelow(Date.now() - beginDate, 5);
    });

    it('> should propagate promise error if any before the timeout', async () => {
        const beginDate = Date.now();
        const error = new Error('Business Error');
        const promise = (async () => {
            await sleep(2);
            throw error;
        })();
        const e = await assert.isRejected(waitTimeout(promise, 5)) as unknown as Error;
        assert.equal(e, error);
        assert.isBelow(Date.now() - beginDate, 5);
    });
});
