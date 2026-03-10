import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerAndSubscribeToPush } from './pushService';

vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
    },
}));

describe('pushService', () => {
    let originalNavigator: any;

    beforeEach(() => {
        originalNavigator = globalThis.navigator;
        vi.clearAllMocks();
    });

    it('should warn if push messaging is not supported', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        // Mock unsupported environment
        Object.defineProperty(globalThis, 'navigator', {
            value: {},
            writable: true
        });

        await registerAndSubscribeToPush();

        expect(consoleWarnSpy).toHaveBeenCalledWith('Push messaging is not supported.');

        // Restore
        globalThis.navigator = originalNavigator;
        consoleWarnSpy.mockRestore();
    });
});
