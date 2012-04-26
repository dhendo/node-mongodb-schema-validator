test:
	@mocha -R dot
test-spec:
	@mocha -R spec
tdd:
	watch -n 2 --color mocha -c
.PHONY: test test-spec tdd

