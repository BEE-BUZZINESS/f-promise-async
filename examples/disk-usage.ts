import * as fs from 'mz/fs';
import { join } from 'path';
import { run, wait } from '..';

async function diskUsage(dir: string): Promise<number> {
    return (await wait(fs.readdir(dir))).reduce(async (size: Promise<number>, name) => {
        const sub = join(dir, name);
        const stat = await wait(fs.stat(sub));
        if (stat.isDirectory()) return await size + (await diskUsage(sub));
        else if (stat.isFile()) return await size + stat.size;
        else return size;
    }, Promise.resolve(0));
}

async function printDiskUsage(dir: string) {
    console.log(`${dir}: ${await diskUsage(dir)}`);
}

run(async () => await printDiskUsage(process.cwd())).catch(err => {
    console.error(err.stack);
});
