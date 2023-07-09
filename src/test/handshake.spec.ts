import { assert } from 'chai';

import { run } from '../lib/core';
import { handshake } from '../lib/handshake';
import { sleep } from '../lib/misc/sleep';

describe('> handshake', () => {

    it('> notify without wait', async () => {
        const hk = handshake();
        hk.notify();
        hk.notify();
    });

    it('> wait then notify', async () => {
        const hk = handshake();
        let counter = 0;

        function runSleepAndCount() {
            // tslint:disable-next-line no-floating-promises
            void run(async () => {
                await sleep(10);
                counter++;
                hk.notify();
            });
        }

        assert.equal(counter, 0);
        runSleepAndCount();
        await hk.wait();
        assert.equal(counter, 1);
        runSleepAndCount();
        await hk.wait();
        assert.equal(counter, 2);
    });

    it('> multiple wait fails', async () => {
        const hk = handshake();
        let thrown = false;

        function runAndWait() {
            run(async () => {
                await hk.wait();
            }).catch(() => {
                thrown = true;
            });
        }

        runAndWait();
        runAndWait();
        await sleep(10);
        hk.notify(); // release not thrown run
        assert.equal(thrown, true);
    });
});
