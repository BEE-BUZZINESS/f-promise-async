import { assert } from 'chai';

import { run, wait } from '../lib/core';
import { Queue } from '../lib/queue';

describe('> queue', () => {

    it('> queue overflow', async () => {
        const queue = new Queue<number>(2);
        // must produce and consume in parallel to avoid deadlock
        const produce = run(async () => {
            await queue.write(4);
            await queue.write(9);
            await queue.write(16);
            await queue.write(25);
        });
        const consume = run(async () => {
            assert.strictEqual(await queue.read(), 4);
            assert.strictEqual(await queue.read(), 9);
            assert.strictEqual(await queue.read(), 16);
            assert.strictEqual(await queue.read(), 25);
        });
        await wait(produce);
        await wait(consume);
        assert.strictEqual(queue.peek(), undefined);
    });

    it('> queue length, contents, alter', async () => {
        const queue = new Queue<number>();
        await queue.write(4);
        await queue.write(9);
        await queue.write(16);
        await queue.write(25);
        assert.strictEqual(queue.length, 4);
        assert.strictEqual(queue.peek(), 4);
        assert.deepEqual(queue.contents(), [4, 9, 16, 25]);
        queue.adjust(function (arr) {
            return [arr[3], arr[1]];
        });
        assert.strictEqual(queue.peek(), 25);
        assert.strictEqual(await queue.read(), 25);
        assert.strictEqual(queue.peek(), 9);
        assert.strictEqual(await queue.read(), 9);
        assert.strictEqual(queue.peek(), undefined);
    });

    it('> queue not allow concurrent read', async () => {
        const queue = new Queue<number>(2);

        const consumer1 = run(async () => {
            assert.strictEqual(await queue.read(), 4);
        });
        const consumer2 = run<Error>(async () => {
            await queue.read();
            return new Error('test failed');
        }).catch(e => e);
        await queue.write(4);

        await wait(consumer1);
        assert.equal((await wait(consumer2)).message, 'already getting');
    });
});
