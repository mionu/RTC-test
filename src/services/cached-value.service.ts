type UpdateFunction<T> = () => Promise<T>;
type Cached<T> = {
    data: T;
    expiresAt: number;
};

export class CachedValue<T> {
    private value: Cached<T> | null = null;
    private activePromise: Promise<T> | null = null;

    constructor(private readonly updateFunction: UpdateFunction<T>, private readonly ttlMs: number) {}

    public async getValue(): Promise<T> {
        if (this.value?.data && this.value?.expiresAt < Date.now()) {
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