import { assert } from 'chai';

import { run } from '../lib/core';
import { funnel } from '../lib/funnel';
import { map, sleep } from '../lib/misc';

function sum(array: (number | undefined)[]): number {
    return array.reduce<number>((sum, x) => sum + (x || 0), 0);
}

describe('> funnel', () => {

    it('> less concurrency than allowed', async () => {
        const fun = funnel(4);
        const begin = Date.now();
        const results = await map<number, number | undefined>([10, 10], async timeToSleep => {
            return fun<number>(async () => {
                await sleep(timeToSleep);
                return 1;
            });
        });
        assert.equal(sum(results), 2);
        assert.closeTo(Date.now() - begin, 10, 4);
    });

    it('> more concurrency than allowed', async () => {
        const fun = funnel(2);
        const begin = Date.now();
        const results = await map<number, number | undefined>([10, 10, 10, 10], timeToSleep => {
            return fun<number>(async () => {
                await sleep(timeToSleep);
                return 1;
            });
        });
        assert.equal(sum(results), 4);
        assert.closeTo(Date.now() - begin, 20, 8);
    });

    it('> close funnel access', async () => {
        const fun = funnel(1);
        const begin = Date.now();
        // tslint:disable-next-line no-floating-promises
        void run(async () => {
            await sleep(15);
            fun.close();
        });
        const results = await map<number, number>([10, 10, 10, 10], async timeToSleep => {
            try {
                return await fun<number>(async () => {
                    await sleep(timeToSleep);
                    return 1;
                });
            } catch (err) {
                assert.equal(err.message, 'cannot execute: funnel has been closed');
                return 0;
            }
        });
        assert.equal(sum(results), 2);
        assert.closeTo(Date.now() - begin, 20, 8);
    });
});
