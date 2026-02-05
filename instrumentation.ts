export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const originalEmit = process.emit;
        // @ts-expect-error - Overriding process.emit to filter specific warnings
        process.emit = function (name, data, ...args) {
            if (
                name === 'warning' &&
                typeof data === 'object' &&
                data &&
                'name' in data &&
                data.name === 'DeprecationWarning' &&
                'code' in data &&
                data.code === 'DEP0169'
            ) {
                // Suppress [DEP0169] DeprecationWarning: url.parse() behavior is not standardized...
                return false;
            }
            return originalEmit.apply(process, [name, data, ...args]);
        };
    }
}
