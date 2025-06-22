import { Nullable } from '../models';

type UpdateFunction<T> = () => Promise<T>;
type Cached<T> = {
    data: T;
    expiresAt: number;
};

/**
 * Generic cache wrapper for asynchronously fetched values with TTL.
 */
export class CachedValue<T> {
    private value: Nullable<Cached<T>> = null;
    private activePromise: Nullable<Promise<T>> = null;

    /**
     * @param updateFunction Function to fetch the value.
     * @param ttlMs Time-to-live for the cached value in milliseconds.
     */
    constructor(
        private readonly updateFunction: UpdateFunction<T>,
        private readonly ttlMs: number
    ) {}

    /**
     * Gets the cached value, updating it if expired or forced.
     * @param {boolean} force - If true, forces a refresh.
     * @returns {Promise<T>} The cached or freshly fetched value.
     */
    public async getValue(force = false): Promise<T> {
        if (!force && this.value?.data && this.value?.expiresAt > Date.now()) {
            return this.value.data;
        }

        this.activePromise = this.activePromise ?? this.updateFunction();
        const newValue = await this.activePromise;
        this.value = {
            data: newValue,
            expiresAt: Date.now() + this.ttlMs,
        };
        this.activePromise = null;
        return this.value.data;
    }
}
