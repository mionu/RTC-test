import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
    MockInstance,
} from 'vitest';
import { NamesMapping } from '../src/models';
import { mappingService, sportEventsService } from '../src/services';

describe('MappingService', () => {
    let mapping: NamesMapping;

    beforeEach(() => {
        mapping = new Map<string, string>([
            ['id1', 'Name 1'],
            ['id2', 'Name 2'],
        ]);
    });

    describe('getName', () => {
        it('returns the mapped name for a valid id', () => {
            expect(mappingService.getName('id1', mapping)).toBe('Name 1');
        });

        it('throws and triggers cache refresh if id not found', () => {
            const spy = vi.spyOn(mappingService.namesMapping, 'getValue');
            expect(() => mappingService.getName('id3', mapping)).toThrow(
                'No name for id id3'
            );
            expect(spy).toHaveBeenCalledWith(true);
            spy.mockRestore();
        });
    });

    describe('parseMapping', () => {
        it('parses mapping string into NamesMapping', () => {
            const str = 'id1:Name 1;id2:Name 2';
            const result = mappingService['parseMapping'](str);
            expect(result.get('id1')).toBe('Name 1');
            expect(result.get('id2')).toBe('Name 2');
        });

        it('handles empty mapping string', () => {
            const result = mappingService['parseMapping']('');
            expect(result.size).toBe(1);
            expect(result.has('')).toBe(true);
        });
    });

    describe('getNamesMapping', () => {
        let getNamesMappingMock: MockInstance;

        beforeEach(() => {
            getNamesMappingMock = vi.spyOn(
                sportEventsService,
                'getNamesMapping'
            );
        });

        afterEach(() => {
            getNamesMappingMock.mockRestore();
        });

        it('returns parsed mapping on success', async () => {
            getNamesMappingMock.mockResolvedValue({
                data: { mappings: 'id1:Name 1;id2:Name 2' },
            } as any);
            const result = await mappingService['getNamesMapping']();
            expect(result.get('id1')).toBe('Name 1');
            expect(result.get('id2')).toBe('Name 2');
        });

        it('returns empty map and logs error on failure', async () => {
            const error = new Error('fail');
            getNamesMappingMock.mockRejectedValue(error);
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            const result = await mappingService['getNamesMapping']();
            expect(result.size).toBe(0);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
