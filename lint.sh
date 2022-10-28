#!/bin/sh
diff=$(git diff master... --name-only -- "*.ts" "*.tsx" "*.js" "*.jsx")

eslint --cache --fix $diff

tsc --noEmit --strictNullChecks $diff