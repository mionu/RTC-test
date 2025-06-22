import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { CachedValue } from '../src/services/cached-value.service';

describe('CachedValue', () => {
    let fetchFn: Mock<() => Promise<number>>;
    let cached: CachedValue<number>;
    const TTL = 100;

    beforeEach(() => {
        fetchFn = vi.fn().mockResolvedValue(42);
        cached = new CachedValue(fetchFn, TTL);
        vi.useFakeTimers();
        vi.setSystemTime(1000);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('fetches value on first call', async () => {
        const value = await cached.getValue();
        expect(value).toBe(42);
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('returns cached value within TTL', async () => {
        await cached.getValue();
        fetchFn.mockResolvedValue(99);
        vi.setSystemTime(1000 + TTL - 1);
        const value = await cached.getValue();
        expect(value).toBe(42);
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('refreshes value after TTL expires', async () => {
        await cached.getValue();
        fetchFn.mockResolvedValue(99);
        vi.setSystemTime(1000 + TTL + 1);
        const value = await cached.getValue();
        expect(value).toBe(99);
        expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('forces refresh when force=true', async () => {
        await cached.getValue();
        fetchFn.mockResolvedValue(77);
        const value = await cached.getValue(true);
        expect(value).toBe(77);
        expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('deduplicates concurrent fetches', async () => {
        let resolve: (v: number) => void;
        fetchFn = vi
            .fn()
            .mockImplementation(() => new Promise((r) => (resolve = r)));
        cached = new CachedValue(fetchFn, TTL);

        const p1 = cached.getValue();
        const p2 = cached.getValue();
        expect(fetchFn).toHaveBeenCalledTimes(1);

        resolve!(55);
        expect(await p1).toBe(55);
        expect(await p2).toBe(55);
    });
});
