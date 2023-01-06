import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { map, sleep } from '../../lib/misc';

chai.use(chaiAsPromised as any);
const assert = chai.assert;

describe('> map', () => {

    it('> should return values in correct order', async () => {
        assert.deepEqual(await map([2, 5], async (val: number) => {
            await sleep(0);
            return val;
        }), [2, 5]);
    });

    it('> should reject if an error occurs', async () => {
        await assert.isRejected(map([2, 5], async (val: number) => {
            await sleep(0);
            throw new Error(`err: ${val}`);
        }), 'err: 2');
    });

});
