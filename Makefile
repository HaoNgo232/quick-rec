.PHONY: all build install clean

all: build

build:
	./build.sh

install: build
	./install.sh

clean:
	rm -rf build dist
