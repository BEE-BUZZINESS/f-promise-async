// tslint:disable:no-reference

import { assert } from 'chai';
import * as fs from 'fs';
import * as mzfs from 'mz/fs';
import * as fsp from 'path';
import { canWait, context, eventHandler, run, wait, withContext } from '../lib/core';
import { map, sleep } from '../lib/misc';

async function delay<T>(val: T, millis?: number) {
    await sleep(millis || 0);
    return val;
}

async function delayFail(reason: any, millis?: number) {
    await sleep(millis || 0);
    throw new Error(`reason: ${reason}`);
}

process.on('unhandledRejection', err => {
    assert.fail(`Unhandled rejected promise: ${(err as any)?.stack || err}`);
});

describe('> wait', () => {

    it('> promise wait with success', done => {
        const p = run(async () => {
            const fname = fsp.join(__dirname, '../../src/test/core.spec.ts');
            const text = await wait(mzfs.readFile(fname, 'utf8'));
            assert.typeOf(text, 'string');
            assert.ok(text.length > 200);
            assert.ok(text.indexOf('// tslint') === 0);
            const text2 = await wait(mzfs.readFile(fname, 'utf8'));
            assert.equal(text, text2);
            return 'success';
        });
        p.then(result => {
            assert.equal(result, 'success');
            done();
        }, done);
    });

    it('> promise wait with error', done => {
        const p = run(async () => {
            const fname = fsp.join(__dirname, './test.not.exist');
            await wait(mzfs.readFile(fname, 'utf8'));
        });
        p.then(
            result => {
                assert.fail();
                done();
            },
            e => {
                done();
            },
        );
    });

    it('> callback wait with success', done => {
        const p = run(async () => {
            const fname = fsp.join(__dirname, '../../src/test/core.spec.ts');
            const text = await wait<string>(cb => fs.readFile(fname, 'utf8', cb));
            assert.typeOf(text, 'string');
            assert.ok(text.length > 200);
            assert.ok(text.indexOf('// tslint') === 0);
            const text2 = await wait<string>(cb => fs.readFile(fname, 'utf8', cb));
            assert.equal(text, text2);
            return 'success';
        });
        p.then(result => {
            assert.equal(result, 'success');
            done();
        }, done);
    });

    it('> callback wait with error', done => {
        const p = run(async () => {
            const fname = fsp.join(__dirname, './test.not.exist');
            await wait<string>(cb => fs.readFile(fname, 'utf8', cb));
        });
        p.then(
            result => {
                assert.fail();
                done();
            },
            e => {
                done();
            },
        );
    });

    it('> wait into a callback wait', done => {
        const p = run(async () => {
            await wait(async cb => {
                await wait(_cb => process.nextTick(_cb));
                cb(null, null);
            });
        });
        p.then(done, done);
    });
});

describe('> contexts', () => {

    const mainCx = context();

    it('> is main at top level', () => {
        assert.equal(context(), mainCx);
    });

    it('> is main inside run', done => {
        run(async () => {
            assert.equal(context(), mainCx);
        }).then(done, done);
    });

    it('> is scoped inside withContext', done => {
        const cx = {};
        run(async () => {
            assert.equal(context(), mainCx);
            await withContext(async () => {
                assert.equal(context(), cx);
            }, cx);
            assert.equal(context(), mainCx);
        }).then(done, done);
    });

    it('> contexts', done => {
        run(async () => {
            function testContext(x: number) {
                return withContext(async () => {
                    const y = await delay(2 * x);
                    assert.strictEqual(y, 2 * context<number>());
                    return y + 1;
                }, x);
            }

            assert.isObject(context());
            const promises = [run(async () => await testContext(3)), run(async () => await testContext(5))];
            assert.deepEqual(await Promise.all(promises), [7, 11]);
            assert.isObject(context());
        }).then(done, done);
    });
});

describe('> collection functions', () => {

    it('> map', done => {
        run(async () => {
            assert.deepEqual(await map([2, 5], delay), [2, 5]);
            return 'success';
        }).then(result => {
            assert.equal(result, 'success');
            done();
        }, done);
    });

    it('> map with error', done => {
        run(async () => {
            await map([2, 5], delayFail);
            assert.fail();
        })
            .then(_ => assert.fail())
            .catch(err => {
                assert.equal(err.message, 'reason: 2');
                done();
            });
    });
});

describe('> canWait', () => {

    it('> true inside run', done => {
        run(async () => {
            assert.ok(canWait());
            return 'success';
        }).then(result => {
            assert.equal(result, 'success');
            done();
        }, done);
    });

    it('> false outside run', () => {
        assert.notOk(canWait());
    });
});

describe('> eventHandler', () => {

    it('> can wait with it', done => {
        setTimeout(
            eventHandler(() => {
                assert.ok(canWait());
                setImmediate(done);
            }),
            0,
        );
    });

    it('> cannot wait without', done => {
        setTimeout(() => {
            assert.notOk(canWait());
            done();
        }, 0);
    });

    it('> outside run', done => {
        assert.notOk(canWait());
        let sync = true;
        // tslint:disable-next-line no-floating-promises
        eventHandler(async (arg: string) => {
            assert.equal(arg, 'hello', 'arg assert.ok');
            await wait<void>(cb => setTimeout(cb, 0));
            assert.equal(sync, false, 'new fiber');
            done();
        })('hello');
        sync = false;
    });

    it('> inside run', done => {
        // tslint:disable-next-line no-floating-promises
        run(async () => {
            let sync = true;
            assert.ok(canWait());
            await eventHandler(async (arg: string) => {
                assert.equal(arg, 'hello', 'arg assert.ok');
                await wait<void>(cb => setTimeout(cb, 0));
                assert.equal(sync, true, 'same fiber as run');
                done();
            })('hello');
            sync = false;
        });
    });

    it('> preserves arity', () => {
        assert.equal(eventHandler(() => {}).length, 0);
        assert.equal(eventHandler((a: any, b: any) => {}).length, 2);
    });

    it('> starts with a fresh context if outside run', done => {
        assert.ok(!canWait());
        eventHandler(() => {
            assert.isNotNull(context());
            done();
        })();
    });

    it('> preserves context if already inside run', done => {
        // tslint:disable-next-line no-floating-promises
        run(async () => {
            assert.ok(canWait());
            const cx = {};
            await withContext(async () => {
                eventHandler(() => {
                    assert.equal(context(), cx);
                    done();
                })();
            }, cx);
        });
    });
});
