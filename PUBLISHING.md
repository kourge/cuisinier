# Publishing this package

This package uses special scripts. When making a new release, always run these
commands in this order:

```
npm version BUMP # where BUMP is one of `patch`, `minor`, or `major`
git push --tags
npm run build
npm publish ./lib
```

The last line is important. We want to publish the contents of `./lib`, not the
entire repo.
