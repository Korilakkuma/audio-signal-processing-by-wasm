# Audio Signal Processing by WebAssembly

## Setup

```bash
$ git clone git@github.com:Korilakkuma/audio-signal-processing-by-wasm.git
$ cd audio-signal-processing-by-wasm
$ npm install
```

### Setup emsdk (Emscripten)

```bash
$ git clone https://github.com/emscripten-core/emsdk.git
$ cd emsdk
$ ./emsdk install latest
$ ./emsdk activate latest
$ source ./emsdk_env.sh

# if error occurred, execute `softwareupdate --install-rosetta`, then retry
```

## Build

```bash
$ npm run build
```

the best optimization build,

```bash
$ npm run build:prod
```

## Start local server

```bash
$ npm run dev
```
