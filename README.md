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
$ ./emsdk install latest  # Use `./emsdk install sdk-upstream-main-64bit` in case of Apple Silicon
$ ./emsdk activate latest # Use `./emsdk activate sdk-upstream-main-64bit` in case of Apple Silicon
$ source ./emsdk_env.sh

# if error occurred, execute `softwareupdate --install-rosetta`, then retry
```

## Build

```bash
$ npm run build
```

## Start local server

```bash
$ npm run dev
```
