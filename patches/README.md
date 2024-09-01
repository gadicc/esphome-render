# patches

We use [`patch-package`](https://www.npmjs.com/package/patch-package)
to patch used packages. So far, just for for `JSCPP`.

Usage:

1. Edit e.g. `node_modules/JSCPP/...`
1. Stop `yarn dev`, run `rm -rf .next/cache/`, restart `yarn dev`, check that it works.
1. `npx patch-package JSCPP`
1. Commit as per the recommendations.
