#!/bin/sh
diff=$(git diff master... --name-only -- $@ )
echo -e "\033[34m 【开始 ts 和 eslint 检查】 \033[0m" 
tsc --noEmit --strictNullChecks $diff & eslint --cache --fix $diff 

wait