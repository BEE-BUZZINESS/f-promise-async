// tslint:disable:no-reference
import { assert } from 'chai';
import * as fs from 'fs';
import * as mzfs from 'mz/fs';
import * as fsp from 'path';
import { canWait, context, eventHandler, funnel, handshake, map, Queue, run, sleep, wait, withContext } from '..';

const {
    ok,
    notOk,
    equal,
    notEqual,
    deepEqual,
    strictEqual,
    closeTo,
    fail,
    typeOf,
    isNull,
    isNotNull,
    isUndefined,
    isObject,
    throws,
} = assert;

function test(name: string, fn: () => Promise<void>) {
    it(name, done => {
        run(fn).then(done, done);
    });
}

async function delay<T>(val: T, millis?: number) {
    await sleep(millis || 0);
    return val;
}

async function delayFail<T>(reason: any, millis?: number) {
    await sleep(millis || 0);
    throw new Error(`reason: ${reason}`);
}

function sum(array: (number | undefined)[]): number {
    return array.reduce<number>((sum, x) => sum + (x || 0), 0);
}

process.on('unhandledRejection', err => {
    fail(`Unhandled rejected promise: ${(err as any)?.stack || err}`);
});

describe('wait', () => {
    it('promise wait with success', done => {
        const p = run(async () => {
            const fname = fsp.join(__dirname, '../../test/f-promise-test.ts');
            const text = await wait(mzfs.readFile(fname, 'utf8'));
            typeOf(text, 'string');
            ok(text.length > 200);
            ok(text.indexOf('// tslint') === 0);
            const text2 = await wait(mzfs.readFile(fname, 'utf8'));
            equal(text, text2);
            return 'success';
        });
        p.then(result => {
            equal(result, 'success');
            done();
        }, done);
    });
    it('promise wait with error', done => {
        const p = run(async () => {
            const fname = fsp.join(__dirname, '../../test/f-promise-test.ts.not.exist');
            await wait(mzfs.readFile(fname, 'utf8'));
        });
        p.then(
            result => {
                fail();
                done();
            },
            e => {
                done();
            },
        );
    });
    it('callback wait with success', done => {
        const p = run(async () => {
            const fname = fsp.join(__dirname, '../../test/f-promise-test.ts');
            const text = await wait<string>(cb => fs.readFile(fname, 'utf8', cb));
            typeOf(text, 'string');
            ok(text.length > 200);
            ok(text.indexOf('// tslint') === 0);
            const text2 = await wait<string>(cb => fs.readFile(fname, 'utf8', cb));
            equal(text, text2);
            return 'success';
        });
        p.then(result => {
            equal(result, 'success');
            done();
        }, done);
    });
    it('callback wait with error', done => {
        const p = run(async () => {
            const fname = fsp.join(__dirname, '../../test/f-promise-test.ts.not.exist');
            await wait<string>(cb => fs.readFile(fname, 'utf8', cb));
        });
        p.then(
            result => {
                fail();
                done();
            },
            e => {
                done();
            },
        );
    });
    it('wait into a callback wait', done => {
        const p = run(async () => {
            await wait(async cb => {
                await wait(_cb => process.nextTick(_cb));
                cb(null, null);
            });
        });
        p.then(done, done);
    });
});

describe('queue', () => {
    test('queue overflow', async () => {
        const queue = new Queue<number>(2);
        // must produce and consume in parallel to avoid deadlock
        const produce = run(async () => {
            await queue.write(4);
            await queue.write(9);
            await queue.write(16);
            await queue.write(25);
        });
        const consume = run(async () => {
            strictEqual(await queue.read(), 4);
            strictEqual(await queue.read(), 9);
            strictEqual(await queue.read(), 16);
            strictEqual(await queue.read(), 25);
        });
        await wait(produce);
        await wait(consume);
        strictEqual(queue.peek(), undefined);
    });

    test('queue length, contents, alter', async () => {
        const queue = new Queue<number>();
        await queue.write(4);
        await queue.write(9);
        await queue.write(16);
        await queue.write(25);
        strictEqual(queue.length, 4);
        strictEqual(queue.peek(), 4);
        deepEqual(queue.contents(), [4, 9, 16, 25]);
        queue.adjust(function(arr) {
            return [arr[3], arr[1]];
        });
        strictEqual(queue.peek(), 25);
        strictEqual(await queue.read(), 25);
        strictEqual(queue.peek(), 9);
        strictEqual(await queue.read(), 9);
        strictEqual(queue.peek(), undefined);
    });

    test('queue not allow concurrent read', async () => {
        const queue = new Queue<number>(2);

        const consumer1 = run(async () => {
            strictEqual(await queue.read(), 4);
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

describe('handshake', () => {
    test('notify without wait', async () => {
        const hk = handshake();
        hk.notify();
        hk.notify();
    });
    test('wait then notify', async () => {
        const hk = handshake();
        let counter = 0;

        function runSleepAndCount() {
            run(async () => {
                await sleep(10);
                counter++;
                hk.notify();
            });
        }

        equal(counter, 0);
        runSleepAndCount();
        await hk.wait();
        equal(counter, 1);
        runSleepAndCount();
        await hk.wait();
        equal(counter, 2);
    });
    test('multiple wait fails', async () => {
        const hk = handshake();
        let thrown = false;
        function runAndWait() {
            run(async () => {
                await hk.wait();
            }).catch(e => {
                thrown = true;
            });
        }
        runAndWait();
        runAndWait();
        await sleep(10);
        hk.notify(); // release not thrown run
        equal(thrown, true);
    });
});

describe('funnel', () => {
    test('less concurrency than allowed', async () => {
        const fun = funnel(4);
        const begin = Date.now();
        const results = await map<number, number | undefined>([10, 10], async timeToSleep => {
            return fun<number>(async () => {
                await sleep(timeToSleep);
                return 1;
            });
        });
        equal(sum(results), 2);
        closeTo(Date.now() - begin, 10, 4);
    });
    test('more concurrency than allowed', async () => {
        const fun = funnel(2);
        const begin = Date.now();
        const results = await map<number, number | undefined>([10, 10, 10, 10], timeToSleep => {
            return fun<number>(async () => {
                await sleep(timeToSleep);
                return 1;
            });
        });
        equal(sum(results), 4);
        closeTo(Date.now() - begin, 20, 8);
    });
    test('close funnel access', async () => {
        const fun = funnel(1);
        const begin = Date.now();
        run(async () => {
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
                equal(err.message, 'cannot execute: funnel has been closed');
                return 0;
            }
        });
        equal(sum(results), 2);
        closeTo(Date.now() - begin, 20, 8);
    });
});

describe('contexts', () => {
    const mainCx = context();
    it('is main at top level', () => {
        equal(context(), mainCx);
    });
    it('is main inside run', done => {
        run(async () => {
            equal(context(), mainCx);
        }).then(done, done);
    });
    it('is scoped inside withContext', done => {
        const cx = {};
        run(async () => {
            equal(context(), mainCx);
            await withContext(async () => {
                equal(context(), cx);
            }, cx);
            equal(context(), mainCx);
        }).then(done, done);
    });

    it('contexts', done => {
        run(async () => {
            function testContext(x: number) {
                return withContext(async () => {
                    const y = await delay(2 * x);
                    strictEqual(y, 2 * context<number>());
                    return y + 1;
                }, x);
            }

            isObject(context());
            const promises = [run(async () => await testContext(3)), run(async () => await testContext(5))];
            deepEqual(await Promise.all(promises), [7, 11]);
            isObject(context());
        }).then(done, done);
    });
});

describe('collection functions', () => {
    it('map', done => {
        run(async () => {
            deepEqual(await map([2, 5], delay), [2, 5]);
            return 'success';
        }).then(result => {
            equal(result, 'success');
            done();
        }, done);
    });

    it('map with error', done => {
        run(async () => {
            await map([2, 5], delayFail);
            fail();
        })
            .then(_ => fail())
            .catch(err => {
                equal(err.message, 'reason: 2');
                done();
            });
    });
});

describe('canWait', () => {
    it('true inside run', done => {
        run(async () => {
            ok(canWait());
            return 'success';
        }).then(result => {
            equal(result, 'success');
            done();
        }, done);
    });
    it('false outside run', () => {
        notOk(canWait());
    });
});

describe('eventHandler', () => {
    it('can wait with it', done => {
        setTimeout(
            eventHandler(() => {
                ok(canWait());
                setImmediate(done);
            }),
            0,
        );
    });
    it('cannot wait without', done => {
        setTimeout(() => {
            notOk(canWait());
            done();
        }, 0);
    });
    it('outside run', done => {
        notOk(canWait());
        let sync = true;
        eventHandler(async (arg: string) => {
            equal(arg, 'hello', 'arg ok');
            await wait<void>(cb => setTimeout(cb, 0));
            equal(sync, false, 'new fiber');
            done();
        })('hello');
        sync = false;
    });
    it('inside run', done => {
        run(async () => {
            let sync = true;
            ok(canWait());
            await eventHandler(async (arg: string) => {
                equal(arg, 'hello', 'arg ok');
                await wait<void>(cb => setTimeout(cb, 0));
                equal(sync, true, 'same fiber as run');
                done();
            })('hello');
            sync = false;
        });
    });
    it('preserves arity', () => {
        equal(eventHandler(() => {}).length, 0);
        equal(eventHandler((a: any, b: any) => {}).length, 2);
    });
    it('starts with a fresh context if outside run', done => {
        ok(!canWait());
        eventHandler(() => {
            isNotNull(context());
            done();
        })();
    });
    it('preserves context if already inside run', done => {
        run(async () => {
            ok(canWait());
            const cx = {};
            withContext(async () => {
                eventHandler(() => {
                    equal(context(), cx);
                    done();
                })();
            }, cx);
        });
    });
});
